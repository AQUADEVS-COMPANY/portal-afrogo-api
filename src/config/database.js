import mysql from 'mysql2/promise';
import { env } from './env.js';

/** Shared MySQL pool. All dates are handled in UTC. */
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  timezone: 'Z',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/** Connectivity check used by /api/health (the only non-CALL statement). */
export async function pingDatabase() {
  await pool.query('SELECT 1');
}

/** Closes the pool (graceful shutdown). */
export async function closePool() {
  await pool.end();
}
