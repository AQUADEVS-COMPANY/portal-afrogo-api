import { formatInZone } from '../../../utils/datetime.js';

/** Log entry. Dates are converted to the requester's time zone. */
export class DriverLogResponse {
  constructor(log, timeZone) {
    this.id = log.id;
    this.driverId = log.driverId;
    this.user = log.userId ? { id: log.userId, fullName: log.userName } : null;
    this.fullName = log.fullName;
    this.email = log.email;
    this.status = { code: log.statusCode, name: log.statusName };
    this.comment = log.comment;
    const created = formatInZone(log.createdAt, timeZone);
    this.createdAt = created?.iso ?? null;
    this.createdAtDisplay = created?.display ?? null;
  }

  /** @param {import('../entities/driver-log.entity.js').DriverLog} entity @param {string} [timeZone] */
  static fromEntity(entity, timeZone) {
    return new DriverLogResponse(entity, timeZone);
  }
}
