/** Operational error carrying an HTTP status and optional field errors. */
export class AppError extends Error {
  /**
   * @param {number} statusCode HTTP status code.
   * @param {string} message Client-facing message (Spanish).
   * @param {Array<{field: string, message: string}>} [errors] Field-level errors.
   */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
