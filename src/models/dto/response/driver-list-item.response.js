import { formatInZone } from '../../../utils/datetime.js';

/** Driver summary. Never includes PDF data. Dates are converted to the requester's time zone. */
export class DriverListItemResponse {
  constructor(driver, timeZone) {
    this.id = driver.id;
    this.firstName = driver.firstName;
    this.lastName = driver.lastName;
    this.phone = driver.phone;
    this.email = driver.email;
    this.dni = driver.dni;
    this.vehicleType = { code: driver.vehicleTypeCode, name: driver.vehicleTypeName };
    this.status = { code: driver.statusCode, name: driver.statusName };
    const approved = formatInZone(driver.approvedAt, timeZone);
    const created = formatInZone(driver.createdAt, timeZone);
    this.approvedAt = approved?.iso ?? null;
    this.approvedAtDisplay = approved?.display ?? null;
    this.createdAt = created?.iso ?? null;
    this.createdAtDisplay = created?.display ?? null;
  }

  /** @param {import('../entities/driver.entity.js').Driver} entity @param {string} [timeZone] */
  static fromEntity(entity, timeZone) {
    return new DriverListItemResponse(entity, timeZone);
  }
}
