/** Validated query of GET /api/internal/drivers. */
export class ListDriversQueryRequest {
  constructor({ status } = {}) {
    this.status = status;
  }
}
