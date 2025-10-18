import cron from 'node-cron';
import { User } from '../app/modules/user/user.model';
import { printBanner } from './printBanner';
import config from '../config';
// ====== CRON JOB SCHEDULERS ======
// 1. Check for users expiring in 24 hours (send warning email)
const winnerCheck = () => {
     cron.schedule('*/1 * * * *', async () => {
          try {
              
          } catch (error) {
               console.error('❌ Error in trial warning check:', error);
          }
     });
};

const setupTimeManagement = () => {
     console.log('🚀 Setting up trial management cron jobs...');
     // Start all cron jobs
          printBanner(config.server.name as string);
     // scheduleTrialExpiryCheck(); // Every hour
     winnerCheck(); // Daily at 9 AM
};
export default setupTimeManagement;
