import { UserPreference } from "../app/modules/notification/notification.model";
import { User } from "../app/modules/user/user.model";
import { emailTemplate } from "../shared/emailTemplate";
import { emailHelper } from "./emailHelper";
import { getAgenda } from "./jobQueueSystem/agenda";


export const scheduleWeeklySummaryEmails = async (): Promise<void> => {
    try {
        // Cancel any existing weekly summary jobs
        await getAgenda().cancel({ name: 'send-weekly-summary' });
        await getAgenda().every('0 9 * * 1', 'send-weekly-summary');

        console.log('✅ Weekly summary emails scheduled (Every Monday 9 AM)');
    } catch (error) {
        console.error('❌ Failed to schedule weekly summary emails:', error);
    }
};

// Background job for email notifications
export const queueEmailNotifications = async (contest: any) => {
    try {
        // Query users with active preferences - fix: get users, not just preferences
        const contestPreferences = await UserPreference.find({ constants: true }).populate('userId');


        // Send contest creation emails
        const emailPromises = contestPreferences.map(async (preference: any) => {
            try {
                const user = preference.userId || await User.findById(preference.user);

                if (!user?.email) return;
                await getAgenda().now('send-contest-notification', { contestId: contest._id, userId: user._id });
            } catch (error) {
                console.error(`Failed to send email to user:`, error);
            }
        });

        await Promise.all(emailPromises);

        // Schedule reminder emails (1 day before end date)
        await scheduleReminderEmails(contest);

    } catch (error) {
        console.error('Error queuing email notifications:', error);
        throw error;
    }
};

// Schedule reminder emails to be sent 1 day before contest ends
const scheduleReminderEmails = async (contest: any): Promise<void> => {
    try {
        const contestEndDate = new Date(contest.endTime);
        const reminderDate = new Date(contestEndDate);
        reminderDate.setDate(reminderDate.getDate() - 1); // 1 day before contest end

        // Only schedule if reminder date is in the future
        if (reminderDate > new Date()) {
            const delay = reminderDate.getTime() - Date.now();

            // Schedule the reminder email job using Agenda
            if (delay > 0) {
                await getAgenda().schedule(`in ${delay} milliseconds`, 'send-contest-reminder', {
                    contestId: contest._id,
                });
                console.log(`✅ Reminder scheduled for contest ${contest.name} on ${reminderDate.toLocaleString()}`);
            }
        }
    } catch (error) {
        console.error('Error scheduling reminder emails:', error);
        throw error;
    };
}