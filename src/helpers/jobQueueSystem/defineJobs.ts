    import Agenda, { Job } from "agenda";
    import { Contest } from "../../app/modules/contest/contest.model";
    import { User } from "../../app/modules/user/user.model";
    import { emailTemplate } from "../../shared/emailTemplate";
    import { emailHelper } from "../emailHelper";
    import { UserPreference } from "../../app/modules/notification/notification.model";
    import { calculateWeeklyStats } from "../../utils/calculateWeeklyStats";
    import { Order } from "../../app/modules/order/order.model";

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
        agenda.define('send-weekly-summary', async (job: Job): Promise<void> => {
            try {
                console.log('📊 Starting weekly summary email generation...');

                // Get all users who want weekly summaries
                const summaryPreferences = await UserPreference.find({
                    summary: true
                }).populate('userId');

                console.log(`📊 Sending weekly summaries to ${summaryPreferences.length} users`);

                // Get date range for this week
                const now = new Date();
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

                const emailPromises = summaryPreferences.map(async (preference: any) => {
                    try {
                        const user = preference.userId;
                        if (!user?.email) return;

                        // Get user's weekly stats
                        const userOrders = await Order.find({
                            userId: user._id,
                            createdAt: { $gte: oneWeekAgo, $lte: now }
                        }).populate('contestId');

                        const userContests = await Contest.find({
                            _id: { $in: userOrders.map(o => o.contestId) }
                        });

                        // Calculate stats
                        const stats = calculateWeeklyStats(userOrders, userContests);

                        // Send email only if user has activity
                        if (stats.totalEntries > 0 || stats.completedContests > 0) {
                            const sendEmailData = emailTemplate.weeklySummary({
                                email: user.email,
                                userName: user.name || '',
                                stats: stats,
                                weekStart: oneWeekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                weekEnd: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            });

                            await emailHelper.sendEmail(sendEmailData);
                            console.log(`✅ Weekly summary sent to ${user.email}`);
                        } else {
                            console.log(`⏭️  Skipped ${user.email} - no activity this week`);
                        }

                    } catch (error) {
                        console.error(`Failed to send weekly summary:`, error);
                    }
                });

                await Promise.all(emailPromises);
                console.log(`✅ All weekly summaries sent successfully`);

            } catch (error) {
                console.error(`❌ Failed to send weekly summaries:`, error);
                throw error;
            }
        }); 

    }

    export default defineJobs;
