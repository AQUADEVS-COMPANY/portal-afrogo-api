import { DriverListItemResponse } from './driver-list-item.response.js';
import { DOCUMENTS } from '../../../constants/documents.js';

/** Driver detail: summary, tinted-permit flag and the list of available documents (no PDF data). */
export class DriverDetailResponse extends DriverListItemResponse {
  constructor(driver, timeZone) {
    super(driver, timeZone);
    this.hasTintedPermit = Boolean(driver.hasTintedPermit);
    this.documents = DOCUMENTS.filter((doc) => doc.required || this.hasTintedPermit).map((doc) => ({
      code: doc.code,
      label: doc.label,
      required: doc.required,
      url: `/api/admin/drivers/${driver.id}/documents/${doc.code}`,
    }));
  }

  /** @param {import('../entities/driver.entity.js').Driver} entity @param {string} [timeZone] */
  static fromEntity(entity, timeZone) {
    return new DriverDetailResponse(entity, timeZone);
  }
}
