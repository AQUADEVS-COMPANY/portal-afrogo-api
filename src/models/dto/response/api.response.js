/** Single response envelope: { success, message, data, errors }. */
export class ApiResponse {
  constructor({ success, message, data = null, errors = [] }) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.errors = errors;
  }

  /** @param {string} message @param {*} [data] */
  static ok(message, data = null) {
    return new ApiResponse({ success: true, message, data });
  }

  /** @param {string} message @param {Array<{field: string, message: string}>} [errors] */
  static fail(message, errors = []) {
    return new ApiResponse({ success: false, message, errors });
  }
}
