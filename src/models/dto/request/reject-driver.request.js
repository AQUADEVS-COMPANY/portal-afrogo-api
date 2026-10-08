/** Validated body of POST /api/internal/drivers/:id/reject. */
export class RejectDriverRequest {
  constructor({ reason } = {}) {
    this.reason = reason;
  }
}
