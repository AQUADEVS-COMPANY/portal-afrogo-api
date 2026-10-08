import { AppError } from '../utils/app-error.js';

/** Maps stored-procedure messages (SQLSTATE 45000) to HTTP errors. */
const SP_ERRORS = Object.freeze({
  DUPLICATE_PHONE: { status: 409, message: 'Este celular ya está registrado', field: 'phone' },
  DUPLICATE_EMAIL: { status: 409, message: 'Este correo ya está registrado', field: 'email' },
  DUPLICATE_DNI: { status: 409, message: 'Este DNI ya está registrado', field: 'dni' },
  DUPLICATE_DATA: { status: 409, message: 'Ya existe una solicitud con estos datos' },
  INVALID_VEHICLE_TYPE: { status: 400, message: 'El tipo de vehículo no es válido', field: 'vehicleTypeId' },
  INVALID_DOCUMENT: { status: 400, message: 'El tipo de documento no es válido' },
  DRIVER_NOT_FOUND: { status: 404, message: 'Conductor no encontrado' },
  NOT_PENDING: { status: 409, message: 'La solicitud ya fue procesada' },
});

/**
 * Converts a MySQL error raised by a stored procedure into an AppError.
 * @param {Error & {sqlState?: string, sqlMessage?: string}} err
 * @returns {AppError|null} null when the error is not a known SP error.
 */
export function mapSpError(err) {
  if (err?.sqlState !== '45000') return null;
  const mapped = SP_ERRORS[err.sqlMessage];
  if (!mapped) return null;
  const errors = mapped.field ? [{ field: mapped.field, message: mapped.message }] : [];
  return new AppError(mapped.status, mapped.message, errors);
}
