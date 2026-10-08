/** Row of `driver_logs`, plus the status columns returned by sp_driver_log_list. */
export class DriverLog {
  constructor(props) {
    this.id = props.id;
    this.driverId = props.driverId;
    this.userId = props.userId;
    this.userName = props.userName;
    this.fullName = props.fullName;
    this.email = props.email;
    this.statusId = props.statusId;
    this.statusCode = props.statusCode;
    this.statusName = props.statusName;
    this.comment = props.comment;
    this.createdAt = props.createdAt;
  }

  /** @param {object} row snake_case DB row. */
  static fromRow(row) {
    return new DriverLog({
      id: row.id,
      driverId: row.driver_id,
      userId: row.user_id,
      userName: row.user_name,
      fullName: row.full_name,
      email: row.email,
      statusId: row.status_id,
      statusCode: row.status_code,
      statusName: row.status_name,
      comment: row.comment,
      createdAt: row.created_at,
    });
  }
}
