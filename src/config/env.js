import 'dotenv/config';

const REQUIRED = ['DB_HOST', 'DB_USER', 'DB_NAME', 'INTERNAL_API_KEY'];
const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

/** Parses TRUST_PROXY: "true"/"false", a number of hops, or a subnet string. */
function parseTrustProxy(value) {
  if (value === undefined || value === '' || value === 'false' || value === '0') return false;
  if (value === 'true') return true;
  const hops = Number(value);
  return Number.isInteger(hops) ? hops : value;
}

export const env = Object.freeze({
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME,
  },
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  internalApiKey: process.env.INTERNAL_API_KEY,
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  },
  mailFromName: process.env.MAIL_FROM_NAME || 'AfroGo',
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 5,
});
