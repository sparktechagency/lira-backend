import compression from 'compression';
import helmet from 'helmet';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import app from '../app';
import ExpressMongoSanitize from 'express-mongo-sanitize';

// Setup security middleware
export function setupSecurity() {
     // Apply compression middleware
     app.use(compression());
     // Security headers
     app.use(helmet());
     //   app.use(
     //     helmet({
     //       crossOriginResourcePolicy: false,
     //     }),
     //   );
      // Prevent HTTP Parameter Pollution
    app.use(hpp());

    // Sanitize user-supplied data to prevent MongoDB operator injection
    app.use(ExpressMongoSanitize());
    
     const limiter = rateLimit({
          windowMs: 15 * 60 * 1000,
          max: 100,
          standardHeaders: true,
          legacyHeaders: false,
     });
     // Apply rate limiting to all routes
     app.use(limiter);
     // Add request timeout
     app.use((req, res, next) => {
          res.setTimeout(30000, () => {
               res.status(503).send('Request timeout');
          });
          next();
     });
}
