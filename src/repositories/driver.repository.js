import { pool } from '../config/database.js';
import { DOCUMENTS } from '../constants/documents.js';
import { VehicleType } from '../models/entities/vehicle-type.entity.js';
import { Driver } from '../models/entities/driver.entity.js';
import { DriverLog } from '../models/entities/driver-log.entity.js';
import { call } from './sp-call.js';

/** Runs work inside a single connection transaction. */
async function withTransaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/** Only place in the app that talks to the database (CALL sp_...). */
export const driverRepository = {
  /** @returns {Promise<VehicleType[]>} */
  async listVehicleTypes() {
    const rows = await call(pool, 'CALL sp_vehicle_type_list()');
    return rows.map(VehicleType.fromRow);
  },

  /**
   * Registers the driver and stores the PDFs in one transaction.
   * @param {import('../models/dto/request/register-driver.request.js').RegisterDriverRequest} request
   * @param {Object<string, Buffer|null>} documents PDF buffers keyed by form field.
   * @returns {Promise<string>} driver id
   */
  async registerWithDocuments(request, documents) {
    return withTransaction(async (connection) => {
      const rows = await call(connection, 'CALL sp_driver_register(?, ?, ?, ?, ?, ?)', [
        request.firstName,
        request.lastName,
        request.phone,
        request.email,
        request.dni,
        request.vehicleTypeId,
      ]);
      const driverId = rows[0].driver_id;
      const pdfs = DOCUMENTS.map((doc) => documents[doc.field] ?? null);
      await call(connection, 'CALL sp_driver_documents_save(?, ?, ?, ?, ?, ?, ?, ?, ?)', [driverId, ...pdfs]);
      return driverId;
    });
  },

  /** @param {string} [statusCode] @returns {Promise<Driver[]>} */
  async listDrivers(statusCode) {
    const rows = await call(pool, 'CALL sp_driver_list(?)', [statusCode ?? null]);
    return rows.map(Driver.fromRow);
  },

  /** @param {string} driverId @returns {Promise<Driver|null>} */
  async getDriver(driverId) {
    const rows = await call(pool, 'CALL sp_driver_get(?)', [driverId]);
    return rows.length > 0 ? Driver.fromRow(rows[0]) : null;
  },

  /** @returns {Promise<Buffer|null>} PDF content, or null when missing. */
  async getDocument(driverId, documentCode) {
    const rows = await call(pool, 'CALL sp_driver_document_get(?, ?)', [driverId, documentCode]);
    return rows.length > 0 ? rows[0].file_data ?? null : null;
  },

  /** @param {string} driverId @param {string} userId administrator performing the action */
  async approveDriver(driverId, userId) {
    const rows = await call(pool, 'CALL sp_driver_approve(?, ?)', [driverId, userId]);
    return toContact(rows[0]);
  },

  /** @param {string} driverId @param {string} [reason] @param {string} userId administrator performing the action */
  async rejectDriver(driverId, reason, userId) {
    const rows = await call(pool, 'CALL sp_driver_reject(?, ?, ?)', [driverId, reason ?? null, userId]);
    return toContact(rows[0]);
  },

  /** @returns {Promise<DriverLog[]>} */
  async listLogs(driverId, email) {
    const rows = await call(pool, 'CALL sp_driver_log_list(?, ?)', [driverId ?? null, email ?? null]);
    return rows.map(DriverLog.fromRow);
  },
};

function toContact(row) {
  return { firstName: row.first_name, lastName: row.last_name, email: row.email };
}
