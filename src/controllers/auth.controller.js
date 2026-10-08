import { authService } from '../services/auth.service.js';
import { ApiResponse } from '../models/dto/response/api.response.js';
import { LoginRequest } from '../models/dto/request/login.request.js';

/** POST /api/auth/login */
export async function login(req, res) {
  const data = await authService.login(new LoginRequest(req.validated.body));
  res.json(ApiResponse.ok('Inicio de sesión exitoso', data));
}

/** GET /api/auth/me */
export async function me(req, res) {
  res.json(ApiResponse.ok('Usuario obtenido correctamente', authService.me(req.user)));
}
