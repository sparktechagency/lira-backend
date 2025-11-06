// Install: npm install agenda

import Agenda from 'agenda';
import config from '../config';

const agenda = new Agenda({
    db: { address: config.database_url!, collection: 'emailJobs' }
});

// Define the reminder job
agenda.define('send-contest-reminder', async (job) => {
    const { contestId } = job.attrs.data;

    try {
        const contest = await Contest.findById(contestId);
        const reminderPreferences = await UserPreference.find({ reminder: true }).populate('userId');

        const emailPromises = reminderPreferences.map(async (preference: any) => {
            try {
                const user = preference.userId;
                if (!user?.email) return;

                const sendEmailData = emailTemplate.contestReminder({
                    email: user.email,
                    userName: user.name || '',
                    contestName: contest.name || '',
                    endDate: contest.endDate || '',
                });

                await emailHelper.sendEmail(sendEmailData);
            } catch (error) {
                console.error(`Failed to send reminder email:`, error);
            }
        });

        await Promise.all(emailPromises);
    } catch (error) {
        console.error('Reminder job failed:', error);
    }
});

// Start agenda
await agenda.start();

// Updated function
const queueEmailNotifications = async (contest: any) => {
    try {
        // Send immediate emails
        const contestPreferences = await UserPreference.find({ constants: true }).populate('userId');

        const emailPromises = contestPreferences.map(async (preference: any) => {
            try {
                const user = preference.userId;
                if (!user?.email) return;

                const sendEmailData = emailTemplate.createNewContest({
                    email: user.email,
                    userName: user.name || '',
                    category: contest.category || '',
                    startDate: contest.startDate || '',
                    endDate: contest.endDate || '',
                    contestName: contest.name || '',
                });

                await emailHelper.sendEmail(sendEmailData);
            } catch (error) {
                console.error(`Failed to send email:`, error);
            }
        });

        await Promise.all(emailPromises);

        // Schedule reminder (1 day before end)
        const contestEndDate = new Date(contest.endDate);
        const reminderDate = new Date(contestEndDate);
        reminderDate.setDate(reminderDate.getDate() - 1);

        if (reminderDate > new Date()) {
            await agenda.schedule(reminderDate, 'send-contest-reminder', {
                contestId: contest._id
            });
        }

    } catch (error) {
        console.error('Error queuing email notifications:', error);
        throw error;
    }
};