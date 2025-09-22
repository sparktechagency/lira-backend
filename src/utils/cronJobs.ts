import cron from 'node-cron';
import { User } from '../app/modules/user/user.model';
import { printBanner } from './printBanner';
import config from '../config';
// ====== CRON JOB SCHEDULERS ======
// 1. Check for users expiring in 24 hours (send warning email)
const scheduleTrialWarningCheck = () => {
     // Run every day at 9:00 AM '0 9 * * *'
     cron.schedule('*/1 * * * *', async () => {
          try {
               console.log('🔔 Checking for trials expiring in 24 hours...');

               const tomorrow = new Date();
               tomorrow.setDate(tomorrow.getDate() + 1);
               tomorrow.setHours(23, 59, 59, 999); // End of tomorrow

               const today = new Date();
               today.setHours(23, 59, 59, 999); // End of today

               // Find users whose trial expires tomorrow
               const usersExpiringTomorrow = await User.find({
                    isFreeTrial: true,
                    hasAccess: true,
                    trialExpireAt: {
                         $gte: today,
                         $lte: tomorrow,
                    },
               });

               console.log(`📧 Found ${usersExpiringTomorrow.length} users expiring tomorrow`);
               console.log('✅ Trial warning emails sent');
          } catch (error) {
               console.error('❌ Error in trial warning check:', error);
          }
     });
};
// 2. Check for expired trials every hour
const scheduleTrialExpiryCheck = () => {
     // Run every hour '0 * * * *'
     cron.schedule('*/1 * * * *', async () => {
          try {
               console.log('⏰ Checking for expired free trials...');

               const now = new Date();

               // Find users whose trial has expired
               const expiredUsers = await User.find({
                    isFreeTrial: true,
                    trialExpireAt: { $lt: now },
               });

               if (expiredUsers.length > 0) {
                    console.log(`🚫 Found ${expiredUsers.length} expired trial users`);

                    // Update expired users
                    const updateResult = await User.updateMany(
                         {
                              isFreeTrial: true,
                              trialExpireAt: { $lt: now },
                         },
                         {
                              $set: {
                                   isFreeTrial: false,
                                   hasAccess: false,
                                   trialExpiredAt: now, // Track when trial expired
                              },
                              $inc: { tokenVersion: 1 },
                         },
                    );

                    console.log(`✅ Updated ${updateResult.modifiedCount} expired users`);
               } else {
                    console.log('✅ No expired trials found');
               }
          } catch (error) {
               console.error('❌ Error in trial expiry check:', error);
          }
     });
};

const setupTimeManagement = () => {
     console.log('🚀 Setting up trial management cron jobs...');
     // Start all cron jobs
          printBanner(config.server.name as string);
     scheduleTrialExpiryCheck(); // Every hour
     scheduleTrialWarningCheck(); // Daily at 9 AM
};
export default setupTimeManagement;
