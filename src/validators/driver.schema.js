import { z } from 'zod';
import { DOCUMENT_CODES } from '../constants/documents.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAME_REGEX = /^[\p{L}\p{M}' .-]+$/u;

/** Treats empty strings (e.g. "?status=") as absent. */
const emptyToUndefined = (value) => (value === '' ? undefined : value);

const personName = (label, max) =>
  z
    .string({ required_error: `${label} es obligatorio`, invalid_type_error: `${label} no es válido` })
    .trim()
    .min(2, `${label} debe tener al menos 2 caracteres`)
    .max(max, `${label} no puede superar los ${max} caracteres`)
    .regex(NAME_REGEX, `${label} solo puede contener letras`);

export const registerDriverSchema = z.object({
  firstName: personName('Los nombres', 80),
  lastName: personName('Los apellidos', 80),
  dni: z
    .string({ required_error: 'El DNI es obligatorio' })
    .trim()
    .regex(/^\d{8}$/, 'El DNI debe tener 8 dígitos'),
  phone: z
    .string({ required_error: 'El celular es obligatorio' })
    .trim()
    .regex(/^9\d{8}$/, 'El celular debe tener 9 dígitos y empezar con 9'),
  email: z
    .string({ required_error: 'El correo es obligatorio' })
    .trim()
    .toLowerCase()
    .email('El correo no es válido')
    .max(150, 'El correo no puede superar los 150 caracteres'),
  vehicleTypeId: z.coerce
    .number({ required_error: 'Selecciona un tipo de vehículo', invalid_type_error: 'Selecciona un tipo de vehículo' })
    .int('Selecciona un tipo de vehículo')
    .positive('Selecciona un tipo de vehículo'),
});

export const rejectDriverSchema = z.object({
  reason: z
    .string({ invalid_type_error: 'El motivo no es válido' })
    .trim()
    .max(200, 'El motivo no puede superar los 200 caracteres')
    .optional()
    .transform((value) => value || undefined),
});

export const listDriversQuerySchema = z.object({
  status: z.preprocess(
    emptyToUndefined,
    z.enum(['pending', 'approved'], { errorMap: () => ({ message: 'El estado debe ser pending o approved' }) }).optional(),
  ),
});

export const driverLogQuerySchema = z.object({
  driverId: z.preprocess(emptyToUndefined, z.string().regex(UUID_REGEX, 'El driverId no es válido').optional()),
  email: z.preprocess(
    emptyToUndefined,
    z.string().trim().email('El correo no es válido').max(150, 'El correo no puede superar los 150 caracteres').optional(),
  ),
});

const driverId = z.string().regex(UUID_REGEX, 'El identificador del conductor no es válido');

export const driverIdParamSchema = z.object({ id: driverId });

export const documentParamSchema = z.object({
  id: driverId,
  type: z.enum(DOCUMENT_CODES, { errorMap: () => ({ message: 'El tipo de documento no es válido' }) }),
});
