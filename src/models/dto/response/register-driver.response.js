export class RegisterDriverResponse {
  constructor(driverId, status = 'pending') {
    this.driverId = driverId;
    this.status = status;
  }

  /** @param {string} driverId */
  static fromDriverId(driverId) {
    return new RegisterDriverResponse(driverId);
  }
}
