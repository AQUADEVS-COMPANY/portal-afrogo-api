import { driverService } from '../services/driver.service.js';
import { ApiResponse } from '../models/dto/response/api.response.js';
import { RegisterDriverRequest } from '../models/dto/request/register-driver.request.js';

/** GET /api/vehicle-types */
export async function listVehicleTypes(req, res) {
  const data = await driverService.listVehicleTypes();
  res.json(ApiResponse.ok('Tipos de vehículo obtenidos correctamente', data));
}

/** POST /api/drivers */
export async function registerDriver(req, res) {
  const request = new RegisterDriverRequest(req.validated.body);
  const data = await driverService.registerDriver(request, req.documents);
  res.status(201).json(ApiResponse.ok('Solicitud enviada. Tu solicitud está pendiente de revisión.', data));
}
