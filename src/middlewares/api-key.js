import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { ApiResponse } from '../models/dto/response/api.response.js';

const sha256 = (value) => createHash('sha256').update(value).digest();
const expectedHash = sha256(env.internalApiKey);

/** Validates the x-api-key header in constant time (hashing equalizes lengths). */
export function apiKey(req, res, next) {
  const provided = req.get('x-api-key');
  if (typeof provided === 'string' && timingSafeEqual(sha256(provided), expectedHash)) {
    return next();
  }
  return res.status(401).json(ApiResponse.fail('No autorizado'));
}
