/**
 * mysql2 returns CALL results as [rows, ResultSetHeader]; the first result set is rows.
 * Procedures without SELECT return a bare ResultSetHeader.
 */
const firstResultSet = (result) => (Array.isArray(result) && Array.isArray(result[0]) ? result[0] : []);

/** Runs a CALL with a prepared statement (binary protocol, so PDFs are not hex-escaped). */
export async function call(executor, sql, params = []) {
  const [result] = await executor.execute(sql, params);
  return firstResultSet(result);
}
