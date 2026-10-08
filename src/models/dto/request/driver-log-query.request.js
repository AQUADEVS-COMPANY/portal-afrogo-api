/** Validated query of GET /api/internal/driver-logs. */
export class DriverLogQueryRequest {
  constructor({ driverId, email } = {}) {
    this.driverId = driverId;
    this.email = email;
  }
}
