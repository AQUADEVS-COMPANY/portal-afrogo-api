import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../models/dto/response/api.response.js';

const build = (options, message) =>
  rateLimit({
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json(ApiResponse.fail(message)),
    ...options,
  });

/** General limit: 300 requests per 15 minutes per IP. */
export const generalLimiter = build(
  { windowMs: 15 * 60 * 1000, limit: 300 },
  'Demasiadas solicitudes. Inténtalo nuevamente más tarde.',
);

/** Registration limit: 5 applications per hour per IP. */
export const registerLimiter = build(
  { windowMs: 60 * 60 * 1000, limit: 5 },
  'Has superado el límite de solicitudes. Inténtalo nuevamente en una hora.',
);

/** Login limit: 5 failed attempts per 15 minutes per IP (successful logins are not counted). */
export const loginLimiter = build(
  { windowMs: 15 * 60 * 1000, limit: 5, skipSuccessfulRequests: true },
  'Demasiados intentos de inicio de sesión. Inténtalo nuevamente en 15 minutos.',
);
