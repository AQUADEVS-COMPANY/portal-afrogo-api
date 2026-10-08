import { DriverListItemResponse } from './driver-list-item.response.js';

/** Driver detail: summary plus a flag telling if a tinted permit was uploaded. */
export class DriverDetailResponse extends DriverListItemResponse {
  constructor(driver) {
    super(driver);
    this.hasTintedPermit = Boolean(driver.hasTintedPermit);
  }

  /** @param {import('../entities/driver.entity.js').Driver} entity */
  static fromEntity(entity) {
    return new DriverDetailResponse(entity);
  }
}
