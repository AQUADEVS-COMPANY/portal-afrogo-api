import { driverService } from '../services/driver.service.js';
import { ApiResponse } from '../models/dto/response/api.response.js';
import { ListDriversQueryRequest } from '../models/dto/request/list-drivers-query.request.js';
import { RejectDriverRequest } from '../models/dto/request/reject-driver.request.js';
import { DriverLogQueryRequest } from '../models/dto/request/driver-log-query.request.js';

/** GET /api/internal/drivers */
export async function listDrivers(req, res) {
  const data = await driverService.listDrivers(new ListDriversQueryRequest(req.validated.query));
  res.json(ApiResponse.ok('Conductores obtenidos correctamente', data));
}

/** GET /api/internal/drivers/:id */
export async function getDriver(req, res) {
  const data = await driverService.getDriver(req.validated.params.id);
  res.json(ApiResponse.ok('Conductor obtenido correctamente', data));
}

/** GET /api/internal/drivers/:id/documents/:type */
export async function getDocument(req, res) {
  const { id, type } = req.validated.params;
  const file = await driverService.getDocument(id, type);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${type}-${id}.pdf"`,
    'Cache-Control': 'no-store',
  });
  res.send(file);
}

/** POST /api/internal/drivers/:id/approve */
export async function approveDriver(req, res) {
  await driverService.approveDriver(req.validated.params.id);
  res.json(ApiResponse.ok('Solicitud aprobada correctamente'));
}

/** POST /api/internal/drivers/:id/reject */
export async function rejectDriver(req, res) {
  await driverService.rejectDriver(req.validated.params.id, new RejectDriverRequest(req.validated.body));
  res.json(ApiResponse.ok('Solicitud rechazada correctamente'));
}

/** GET /api/internal/driver-logs */
export async function listDriverLogs(req, res) {
  const data = await driverService.listLogs(new DriverLogQueryRequest(req.validated.query));
  res.json(ApiResponse.ok('Bitácora obtenida correctamente', data));
}
