import { AppError } from '../utils/app-error.js';
import { driverRepository } from '../repositories/driver.repository.js';
import { emailService } from './email.service.js';
import { VehicleTypeResponse } from '../models/dto/response/vehicle-type.response.js';
import { RegisterDriverResponse } from '../models/dto/response/register-driver.response.js';
import { DriverListItemResponse } from '../models/dto/response/driver-list-item.response.js';
import { DriverDetailResponse } from '../models/dto/response/driver-detail.response.js';
import { DriverLogResponse } from '../models/dto/response/driver-log.response.js';

export const driverService = {
  async listVehicleTypes() {
    const types = await driverRepository.listVehicleTypes();
    return types.map(VehicleTypeResponse.fromEntity);
  },

  /**
   * Stores the application and sends the "pending" email after the commit.
   * @param {import('../models/dto/request/register-driver.request.js').RegisterDriverRequest} request
   * @param {Object<string, Buffer|null>} documents
   */
  async registerDriver(request, documents) {
    const driverId = await driverRepository.registerWithDocuments(request, documents);
    void emailService.sendPending(request); // never rejects; does not delay the response
    return RegisterDriverResponse.fromDriverId(driverId);
  },

  /** @param {import('../models/dto/request/list-drivers-query.request.js').ListDriversQueryRequest} query */
  async listDrivers(query) {
    const drivers = await driverRepository.listDrivers(query.status);
    return drivers.map(DriverListItemResponse.fromEntity);
  },

  async getDriver(driverId) {
    const driver = await driverRepository.getDriver(driverId);
    if (!driver) throw new AppError(404, 'Conductor no encontrado');
    return DriverDetailResponse.fromEntity(driver);
  },

  /** @returns {Promise<Buffer>} */
  async getDocument(driverId, documentCode) {
    const file = await driverRepository.getDocument(driverId, documentCode);
    if (!file) throw new AppError(404, 'Documento no encontrado');
    return file;
  },

  async approveDriver(driverId) {
    const contact = await driverRepository.approveDriver(driverId);
    void emailService.sendApproved(contact);
  },

  /** @param {import('../models/dto/request/reject-driver.request.js').RejectDriverRequest} request */
  async rejectDriver(driverId, request) {
    const contact = await driverRepository.rejectDriver(driverId, request.reason);
    void emailService.sendRejected({ ...contact, reason: request.reason });
  },

  /** @param {import('../models/dto/request/driver-log-query.request.js').DriverLogQueryRequest} query */
  async listLogs(query) {
    const logs = await driverRepository.listLogs(query.driverId, query.email);
    return logs.map(DriverLogResponse.fromEntity);
  },
};
