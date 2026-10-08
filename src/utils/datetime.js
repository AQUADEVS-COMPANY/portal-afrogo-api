export const DEFAULT_TIME_ZONE = 'America/Lima';

/**
 * Checks that the value is a valid IANA time zone (e.g. "America/Lima").
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidTimeZone(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * Converts a UTC date to the given time zone.
 * @param {Date|string|null|undefined} value
 * @param {string} [timeZone] IANA time zone.
 * @returns {{iso: string, display: string}|null} ISO string with offset and a display string (es-PE).
 */
export function formatInZone(value, timeZone = DEFAULT_TIME_ZONE) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );

  const ms = date.getUTCMilliseconds();
  const localAsUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour), Number(parts.minute), Number(parts.second), ms,
  );
  const offsetMinutes = Math.round((localAsUtc - date.getTime()) / 60000);
  const sign = offsetMinutes < 0 ? '-' : '+';
  const abs = Math.abs(offsetMinutes);
  const offset = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;

  const iso = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${String(ms).padStart(3, '0')}${offset}`;
  const display = new Intl.DateTimeFormat('es-PE', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .replace(',', '');

  return { iso, display };
}
