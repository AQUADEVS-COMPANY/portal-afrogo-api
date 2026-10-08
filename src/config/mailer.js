import nodemailer from 'nodemailer';
import { env } from './env.js';

/** Gmail SMTP transporter (use an app password, not the account password). */
export const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: { user: env.smtp.user, pass: env.smtp.password },
});

export const mailFrom = `"${env.mailFromName}" <${env.smtp.user}>`;
