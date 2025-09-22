import mongoose from 'mongoose';
import colors from 'colors';
import { errorLogger, logger } from '../shared/logger';
import { httpServer, socketServer } from '../server';

const SHUTDOWN_TIMEOUT_MS = 30000;
declare global {
     var isShuttingDown: boolean;
}
export function gracefulShutdown(signal: string) {
     if (global.isShuttingDown) return;
     global.isShuttingDown = true;

     logger.info(colors.blue(`${signal} received. Shutting down gracefully...`));

     // Stop accepting new connections first
     if (httpServer) {
          httpServer.close(() => {
               logger.info(colors.green('HTTP server closed successfully'));
          });
     }

     // Close socket server if exists
     if (socketServer) {
          socketServer.close(() => {
               logger.info(colors.green('Socket.io server closed successfully'));
          });
     }


     // Force shutdown after timeout if graceful shutdown fails
     setTimeout(() => {
          errorLogger.error(colors.red(`Forcing shutdown after ${SHUTDOWN_TIMEOUT_MS}ms timeout`));
          process.exit(1);
     }, SHUTDOWN_TIMEOUT_MS);
}
