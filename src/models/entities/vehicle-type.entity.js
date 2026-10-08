/** Row of `vehicle_types`. */
export class VehicleType {
  constructor({ id, code, name }) {
    this.id = id;
    this.code = code;
    this.name = name;
  }

  /** @param {object} row snake_case DB row. */
  static fromRow(row) {
    return new VehicleType({ id: row.id, code: row.code, name: row.name });
  }
}
