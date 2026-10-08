/** Public user data. Never includes the password hash. */
export class UserResponse {
  constructor(user) {
    this.id = user.id;
    this.fullName = user.fullName;
    this.email = user.email;
    this.role = { code: user.roleCode, name: user.roleName };
  }

  /** @param {import('../entities/user.entity.js').User} entity */
  static fromEntity(entity) {
    return new UserResponse(entity);
  }
}
