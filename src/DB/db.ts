import mongoose from 'mongoose';
import colors from 'colors';
import { errorLogger, logger } from '../shared/logger';
import config from '../config';
import { startAgenda, stopAgenda, isAgendaRunning } from '../helpers/jobQueueSystem/agenda';
import { scheduleWeeklySummaryEmails } from '../helpers/asyncEmailSend';

// Set up MongoDB connection listeners
export function setupMongooseListeners(): void {
     mongoose.connection.on('connected', () => {
          logger.info(colors.green('MongoDB connected'));
     });

     mongoose.connection.on('error', (err) => {
          errorLogger.error(colors.red('MongoDB connection error:'), err);
          if (config.node_env === 'production') {
               logger.error(colors.red('Critical database error - initiating graceful shutdown'));
               // Let gracefulShutdown handle the cleanup
               process.kill(process.pid, 'SIGTERM');
          }
     });

     mongoose.connection.on('disconnected', () => {
          logger.warn(colors.yellow('MongoDB disconnected. Attempting to reconnect...'));

          // Stop agenda when MongoDB disconnects
          if (isAgendaRunning()) {
               stopAgenda().catch(err =>
                    errorLogger.error('Failed to stop Agenda on disconnect:', err)
               );
          }
     });

     mongoose.connection.on('reconnected', async () => {
          logger.info(colors.green('MongoDB reconnected successfully'));

          // Restart agenda when MongoDB reconnects
          try {
               if (!isAgendaRunning()) {
                    await startAgenda();
                    logger.info(colors.bgBlue('🚀 Agenda restarted after reconnection'));
               }
          } catch (error) {
               errorLogger.error('Failed to restart Agenda:', error);
          }
     });

     mongoose.connection.on('reconnectFailed', () => {
          errorLogger.error(colors.red('MongoDB reconnection failed after multiple attempts'));
          if (config.node_env === 'production') {
               // Trigger graceful shutdown
               process.kill(process.pid, 'SIGTERM');
          }
     });
}

// Connect to MongoDB
export async function connectToDatabase(): Promise<void> {
     try {
          // First connect to MongoDB
          await mongoose.connect(config.database_url as string, {
               serverSelectionTimeoutMS: 5000,
               heartbeatFrequencyMS: 10000,
               maxPoolSize: config.node_env === 'production' ? 100 : 10,
               minPoolSize: config.node_env === 'production' ? 5 : 2,
               connectTimeoutMS: 10000,
               socketTimeoutMS: 45000,
               family: 4, // Force IPv4
               retryWrites: true,
               retryReads: true,
          });

          logger.info(colors.bgCyan('🚀 Database connected successfully'));
          // Setup listeners after connection
          setupMongooseListeners();
          
          // Then start Agenda
          await startAgenda();
          await scheduleWeeklySummaryEmails();
     } catch (error) {
          errorLogger.error(colors.red('Database connection error:'), error);
          // Cleanup before exit
          try {
               await stopAgenda();
          } catch (stopError) {
               errorLogger.error('Failed to stop Agenda during cleanup:', stopError);
          }

          process.exit(1);
     }
}