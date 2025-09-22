import { createServer, Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import colors from 'colors';
import { validateConfig } from './DB/configValidation';
import { connectToDatabase } from './DB/db';
import app from './app';
import config from './config';
import { logger } from './shared/logger';
import { socketHelper } from './helpers/socketHelper';
import { setupProcessHandlers } from './DB/processHandlers';
import { setupSecurity } from './DB/security';
import { setupCluster } from './DB/cluster';

// Define the types for the servers
let httpServer: HttpServer;
let socketServer: SocketServer;

// Function to start the server
export async function startServer() {
     try {
          // Validate config
          validateConfig();
          // Connect to the database
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
          httpServer.listen(httpPort, ipAddress, () => {
               logger.info(colors.bgCyan(`♻️  Application listening on http://${ipAddress}:${httpPort}`));
          });

          // Set up Socket.io server on same port as HTTP server
          socketServer = new SocketServer(httpServer, {
               cors: {
                    origin: config.allowed_origins || '*',
               },
          });
          socketHelper.socket(socketServer);
          //@ts-ignore
          global.io = socketServer;
          logger.info(colors.yellow(`♻️  Socket is listening on same port ${httpPort}`));
     } catch (error) {
          logger.error(colors.red('Failed to start server'), error);
          process.exit(1);
     }
}
// Set up error handlers
setupProcessHandlers();
// Set up security middleware
setupSecurity();
if (config.node_env === 'production') {
     setupCluster();
} else {
     startServer();
}
// Export server instances
export { httpServer, socketServer };
