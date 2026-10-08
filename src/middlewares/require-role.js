import { AppError } from '../utils/app-error.js';

/**
 * Allows the request only when req.user has one of the given role codes.
 * @param {...string} roles
 */
export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.roleCode)
    ? next()
    : next(new AppError(403, 'No tienes permisos para realizar esta acción'));
