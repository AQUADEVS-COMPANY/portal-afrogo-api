import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { generalLimiter } from './middlewares/rate-limiter.js';
import { notFound, errorHandler } from './middlewares/error-handler.js';

/** Builds the Express application. */
export function createApp() {
  const app = express();

  app.set('trust proxy', env.trustProxy);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => callback(null, !origin || env.allowedOrigins.includes(origin)),
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-timezone'],
    }),
  );
  app.use(express.json({ limit: '10kb' }));
  app.use('/api', generalLimiter, routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
