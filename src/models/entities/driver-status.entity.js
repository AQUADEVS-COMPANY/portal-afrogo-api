/** Row of `driver_statuses`. */
export class DriverStatus {
  constructor({ id, code, name }) {
    this.id = id;
    this.code = code;
    this.name = name;
  }

  /** @param {object} row snake_case DB row. */
  static fromRow(row) {
    return new DriverStatus({ id: row.id, code: row.code, name: row.name });
  }
}
