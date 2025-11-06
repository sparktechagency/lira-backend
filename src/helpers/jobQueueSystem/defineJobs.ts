import Agenda, { Job } from "agenda";
import { Contest } from "../../app/modules/contest/contest.model";
import { User } from "../../app/modules/user/user.model";
import { emailTemplate } from "../../shared/emailTemplate";
import { emailHelper } from "../emailHelper";
import { UserPreference } from "../../app/modules/notification/notification.model";

const defineJobs = (agenda: Agenda): void => {
    // Job 1: Send Contest Creation Notification
    agenda.define('send-contest-notification', async (job: Job): Promise<void> => {
        const { contestId, userId } = job.attrs.data;
        try {
            const contest = await Contest.findById(contestId);
            const user = await User.findById(userId);

            if (!user?.email || !contest) {
                console.log(`Skipping email - User or Contest not found`);
                return;
            }

            const sendEmailData = emailTemplate.createNewContest({
                email: user.email,
                userName: user.name || '',
                category: contest.category || '',
                startDate: contest.startTime?.toLocaleDateString() || '',
                endDate: contest.endTime?.toLocaleDateString() || '',
                contestName: contest.name || '',
            });

            await emailHelper.sendEmail(sendEmailData);
            console.log(`✅ Contest notification sent to ${user.email}`);

        } catch (error) {
            console.error(`❌ Failed to send contest notification:`, error);
            throw error; // Agenda will retry
        }
    });

    // Job 2: Send Reminder Email (1 day before contest ends)
    agenda.define('send-contest-reminder', async (job: Job): Promise<void> => {
        const { contestId } = job.attrs.data;

        try {
            const contest = await Contest.findById(contestId);
            if (!contest) {
                console.log(`Contest ${contestId} not found`);
                return;
            }

            // Get all users who want reminders
            const reminderPreferences = await UserPreference.find({
                reminder: true
            }).populate('userId');

            console.log(`📧 Sending reminders to ${reminderPreferences.length} users`);

            const emailPromises = reminderPreferences.map(async (preference: any) => {
                try {
                    const user = preference.userId;
                    if (!user?.email) return;

                    const sendEmailData = emailTemplate.contestReminder({
                        email: user.email,
                        userName: user.name || '',
                        contestName: contest.name || '',
                        endDate: contest.endTime?.toLocaleDateString() || '',
                        hoursLeft: 24,
                    });

                    await emailHelper.sendEmail(sendEmailData);
                    console.log(`✅ Reminder sent to ${user.email}`);

                } catch (error) {
                    console.error(`Failed to send reminder to user:`, error);
                }
            });

            await Promise.all(emailPromises);
            console.log(`✅ All reminders sent for contest: ${contest.name}`);

        } catch (error) {
            console.error(`❌ Failed to send contest reminders:`, error);
            throw error;
        }
    });

    // Job 3: Send Summary Email (after contest ends)
    agenda.define('send-contest-summary', async (job: Job): Promise<void> => {
        const { contestId } = job.attrs.data;

        try {
            const contest = await Contest.findById(contestId);
            if (!contest) {
                console.log(`Contest ${contestId} not found`);
                return;
            }

            // Get all users who want summaries
            const summaryPreferences = await UserPreference.find({
                summary: true
            }).populate('userId');

            console.log(`📊 Sending summaries to ${summaryPreferences.length} users`);

            const emailPromises = summaryPreferences.map(async (preference: any) => {
                try {
                    const user = preference.userId;
                    if (!user?.email) return;

                    const sendEmailData = emailTemplate.contestSummary({
                        email: user.email,
                        userName: user.name || '',
                        contestName: contest.name || '',
                        totalParticipants: contest.participants?.length || 0,
                        winner: contest.results || 'TBA',
                    });

                    await emailHelper.sendEmail(sendEmailData);
                    console.log(`✅ Summary sent to ${user.email}`);

                } catch (error) {
                    console.error(`Failed to send summary to user:`, error);
                }
            });

            await Promise.all(emailPromises);
            console.log(`✅ All summaries sent for contest: ${contest.name}`);

        } catch (error) {
            console.error(`❌ Failed to send contest summaries:`, error);
            throw error;
        }
    });

}

export default defineJobs;
