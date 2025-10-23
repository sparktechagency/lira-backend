import { UserPreference } from "../app/modules/notification/notification.model";
import { User } from "../app/modules/user/user.model";

// Background job for email notifications
const queueEmailNotifications = async (contest: any) => {
    // Query users with active preferences
    const usersWithActivePreferences = await UserPreference.find({ constants: true });

    // Queue email notifications in the background
    usersWithActivePreferences.forEach(async (userPref) => {
        const user = await User.findById(userPref.userId);
        const sendEmailData = {
            to: user?.email || '',
            subject: 'Contest Status Update',
            body: `Dear ${user?.name || ''},\n\nThe contest "${contest.name}" is now active! Participate now and enjoy!\n\nBest regards, Your Team`
        }
        if (user) {
            // Send email via a background job or async function
            // await sendEmail({
            //     to: user.email,
            //     subject: 'Contest Status Update',
            //     body: `Dear ${user.name},\n\nThe contest "${contest.name}" is now active! Participate now and enjoy!\n\nBest regards, Your Team`
            // });
        }
    });
};
