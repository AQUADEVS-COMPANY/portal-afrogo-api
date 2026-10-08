import { mapSpError } from '../constants/error-codes.js';
import { AppError } from '../utils/app-error.js';
import { ApiResponse } from '../models/dto/response/api.response.js';

/** 404 for unknown routes. */
export function notFound(req, res) {
  res.status(404).json(ApiResponse.fail('Recurso no encontrado'));
}

/** Central error handler. Internal details are never sent to the client. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const known = err instanceof AppError ? err : mapSpError(err);
  if (known) {
    return res.status(known.statusCode).json(ApiResponse.fail(known.message, known.errors));
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json(ApiResponse.fail('El cuerpo de la solicitud no es un JSON válido'));
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json(ApiResponse.fail('El cuerpo de la solicitud es demasiado grande'));
  }

  console.error(`[error] ${err?.name}: ${err?.message} (code: ${err?.code ?? 'n/a'})`);
  return res.status(500).json(ApiResponse.fail('Ocurrió un error interno. Inténtalo nuevamente más tarde.'));
}
