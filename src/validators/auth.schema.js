import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo es obligatorio', invalid_type_error: 'El correo no es válido' })
    .trim()
    .toLowerCase()
    .email('El correo no es válido')
    .max(150, 'El correo no puede superar los 150 caracteres'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria', invalid_type_error: 'La contraseña no es válida' })
    .min(1, 'La contraseña es obligatoria')
    .max(128, 'La contraseña no puede superar los 128 caracteres'),
});
