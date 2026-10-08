import { DEFAULT_TIME_ZONE, isValidTimeZone } from '../utils/datetime.js';

/** Reads the x-timezone header (IANA name). Falls back to America/Lima. Sets req.timezone. */
export function timezone(req, res, next) {
  const header = req.get('x-timezone');
  req.timezone = isValidTimeZone(header) ? header : DEFAULT_TIME_ZONE;
  next();
}
