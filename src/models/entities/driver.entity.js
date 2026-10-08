/** Row of `drivers`, plus the joined columns returned by sp_driver_list / sp_driver_get. */
export class Driver {
  constructor(props) {
    this.id = props.id;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.phone = props.phone;
    this.email = props.email;
    this.dni = props.dni;
    this.vehicleTypeId = props.vehicleTypeId;
    this.statusId = props.statusId;
    this.approvedAt = props.approvedAt;
    this.createdAt = props.createdAt;
    this.vehicleTypeCode = props.vehicleTypeCode;
    this.vehicleTypeName = props.vehicleTypeName;
    this.statusCode = props.statusCode;
    this.statusName = props.statusName;
    this.hasTintedPermit = props.hasTintedPermit;
  }

  /** @param {object} row snake_case DB row. */
  static fromRow(row) {
    return new Driver({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      email: row.email,
      dni: row.dni,
      vehicleTypeId: row.vehicle_type_id,
      statusId: row.status_id,
      approvedAt: row.approved_at,
      createdAt: row.created_at,
      vehicleTypeCode: row.vehicle_type_code,
      vehicleTypeName: row.vehicle_type_name,
      statusCode: row.status_code,
      statusName: row.status_name,
      hasTintedPermit: row.has_tinted_permit,
    });
  }
}
