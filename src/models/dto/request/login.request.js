/** Validated body of POST /api/auth/login. */
export class LoginRequest {
  constructor({ email, password }) {
    this.email = email;
    this.password = password;
  }
}
