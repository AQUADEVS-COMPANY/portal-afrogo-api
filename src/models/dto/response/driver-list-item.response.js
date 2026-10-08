/** Driver summary. Never includes PDF data. */
export class DriverListItemResponse {
  constructor(driver) {
    this.id = driver.id;
    this.firstName = driver.firstName;
    this.lastName = driver.lastName;
    this.phone = driver.phone;
    this.email = driver.email;
    this.dni = driver.dni;
    this.vehicleType = { code: driver.vehicleTypeCode, name: driver.vehicleTypeName };
    this.status = { code: driver.statusCode, name: driver.statusName };
    this.approvedAt = driver.approvedAt ? new Date(driver.approvedAt).toISOString() : null;
    this.createdAt = driver.createdAt ? new Date(driver.createdAt).toISOString() : null;
  }

  /** @param {import('../entities/driver.entity.js').Driver} entity */
  static fromEntity(entity) {
    return new DriverListItemResponse(entity);
  }
}
