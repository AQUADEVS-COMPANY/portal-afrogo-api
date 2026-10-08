import { pool } from '../config/database.js';
import { User } from '../models/entities/user.entity.js';
import { call } from './sp-call.js';

/** Users data access (CALL sp_user_...). */
export const userRepository = {
  /** @returns {Promise<User|null>} */
  async findByEmail(email) {
    const rows = await call(pool, 'CALL sp_user_get_by_email(?)', [email]);
    return rows.length > 0 ? User.fromRow(rows[0]) : null;
  },

  /** @returns {Promise<User|null>} */
  async findById(userId) {
    const rows = await call(pool, 'CALL sp_user_get_by_id(?)', [userId]);
    return rows.length > 0 ? User.fromRow(rows[0]) : null;
  },

  /** @returns {Promise<string>} new user id */
  async create({ fullName, email, passwordHash, roleCode }) {
    const rows = await call(pool, 'CALL sp_user_create(?, ?, ?, ?)', [fullName, email, passwordHash, roleCode]);
    return rows[0].user_id;
  },

  async touchLogin(userId) {
    await call(pool, 'CALL sp_user_touch_login(?)', [userId]);
  },
};
