import { createServer, Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import colors from 'colors';
import cluster from 'cluster';
import { validateConfig } from './DB/configValidation';
import { connectToDatabase } from './DB/db';
import app from './app';
import config from './config';
import { logger } from './shared/logger';
import { socketHelper } from './helpers/socketHelper';
import { setupProcessHandlers } from './DB/processHandlers';
import { setupSecurity } from './DB/security';
import { setupCluster } from './DB/cluster';

export let httpServer: HttpServer;
export let socketServer: SocketServer;

export async function startServer(): Promise<void> {
     try {
          // Validate config first
          validateConfig();
          
          // Connect to database (includes Agenda startup)
          await connectToDatabase();
          
          // Create HTTP server
          httpServer = createServer(app);
          const httpPort = Number(config.port);
          const ipAddress = config.ip_address as string;

          // Set timeouts
          httpServer.timeout = 120000;
          httpServer.keepAliveTimeout = 5000;
          httpServer.headersTimeout = 60000;

          // Start HTTP server
          await new Promise<void>((resolve, reject) => {
               httpServer.listen(httpPort, ipAddress, () => {
                    logger.info(colors.bgCyan(`♻️  Worker ${process.pid} listening on http://${ipAddress}:${httpPort}`));
                    resolve();
               });
               httpServer.on('error', reject);
          });

          // Set up Socket.io server
          socketServer = new SocketServer(httpServer, {
               cors: {
                    origin: config.allowed_origins || '*',
                    credentials: true,
               },
               pingTimeout: 60000,
               pingInterval: 25000,
          });
          
          socketHelper.socket(socketServer);
          //@ts-ignore
          global.io = socketServer;
          
          logger.info(colors.yellow(`♻️  Socket.IO ready on worker ${process.pid}`));
          
          // Notify master that worker is ready
          if (cluster.isWorker && process.send) {
               process.send('ready');
          }
          
     } catch (error) {
          logger.error(colors.red(`Worker ${process.pid} failed to start:`), error);
          throw error;
     }
}

// ==========================================
// ENTRY POINT - Runs once at startup
// ==========================================
async function bootstrap() {
     try {
          setupSecurity();
          
          if (config.node_env === 'production') {
               setupCluster();
          } else {
               setupProcessHandlers();
               await startServer();
          }
     } catch (error) {
          logger.error(colors.red('Bootstrap failed:'), error);
          process.exit(1);
     }
}

bootstrap();