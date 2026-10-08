import { UserResponse } from './user.response.js';

/** Login result: token, expiration (UTC ISO) and the user. */
export class AuthResponse {
  constructor(token, expiresAt, user) {
    this.token = token;
    this.expiresAt = expiresAt;
    this.user = user;
  }

  /** @param {string} token @param {number} exp JWT exp (seconds) @param {import('../entities/user.entity.js').User} user */
  static from(token, exp, user) {
    return new AuthResponse(token, new Date(exp * 1000).toISOString(), UserResponse.fromEntity(user));
  }
}
