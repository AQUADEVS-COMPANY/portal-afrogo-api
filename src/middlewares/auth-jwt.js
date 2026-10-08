import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { userRepository } from '../repositories/user.repository.js';

/**
 * Validates the Bearer token and loads the user (role and active flag are read
 * from the database on every request, so changes apply immediately).
 */
export async function authenticate(req, res, next) {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) return next(new AppError(401, 'No autorizado'));

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.secret, { algorithms: ['HS256'] });
  } catch {
    return next(new AppError(401, 'Sesión inválida o expirada'));
  }

  const user = await userRepository.findById(payload.sub);
  if (!user || !user.isActive) return next(new AppError(401, 'No autorizado'));
  req.user = user;
  return next();
}
