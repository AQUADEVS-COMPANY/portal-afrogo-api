/** Validated body of POST /api/drivers. */
export class RegisterDriverRequest {
  constructor({ firstName, lastName, dni, phone, email, vehicleTypeId }) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.dni = dni;
    this.phone = phone;
    this.email = email;
    this.vehicleTypeId = vehicleTypeId;
  }
}
