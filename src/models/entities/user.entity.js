/** Row of `users` joined with its role. */
export class User {
  constructor(props) {
    this.id = props.id;
    this.fullName = props.fullName;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.isActive = props.isActive;
    this.lastLoginAt = props.lastLoginAt;
    this.roleCode = props.roleCode;
    this.roleName = props.roleName;
  }

  /** @param {object} row snake_case DB row. */
  static fromRow(row) {
    return new User({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      passwordHash: row.password_hash,
      isActive: Boolean(row.is_active),
      lastLoginAt: row.last_login_at,
      roleCode: row.role_code,
      roleName: row.role_name,
    });
  }
}
