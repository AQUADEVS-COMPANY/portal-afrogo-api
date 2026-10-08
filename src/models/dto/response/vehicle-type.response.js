export class VehicleTypeResponse {
  constructor({ id, code, name }) {
    this.id = id;
    this.code = code;
    this.name = name;
  }

  /** @param {import('../entities/vehicle-type.entity.js').VehicleType} entity */
  static fromEntity(entity) {
    return new VehicleTypeResponse(entity);
  }
}
