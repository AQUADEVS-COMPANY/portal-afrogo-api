export class DriverLogResponse {
  constructor(log) {
    this.id = log.id;
    this.driverId = log.driverId;
    this.fullName = log.fullName;
    this.email = log.email;
    this.status = { code: log.statusCode, name: log.statusName };
    this.comment = log.comment;
    this.createdAt = log.createdAt ? new Date(log.createdAt).toISOString() : null;
  }

  /** @param {import('../entities/driver-log.entity.js').DriverLog} entity */
  static fromEntity(entity) {
    return new DriverLogResponse(entity);
  }
}
