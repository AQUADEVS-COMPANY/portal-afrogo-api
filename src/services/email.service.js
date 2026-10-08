import { readFile } from 'node:fs/promises';
import { transporter, mailFrom } from '../config/mailer.js';

const templateCache = new Map();

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);

async function loadTemplate(name) {
  if (!templateCache.has(name)) {
    const html = await readFile(new URL(`../templates/${name}.html`, import.meta.url), 'utf8');
    templateCache.set(name, html);
  }
  return templateCache.get(name);
}

/** Replaces {{variables}} (HTML-escaped) and drops the reason block when there is no reason. */
function render(template, { firstName, reason }) {
  const withReason = reason
    ? template.replace(/<!--REASON_START-->|<!--REASON_END-->/g, '')
    : template.replace(/<!--REASON_START-->[\s\S]*?<!--REASON_END-->/g, '');
  return withReason
    .replaceAll('{{firstName}}', escapeHtml(firstName))
    .replaceAll('{{reason}}', escapeHtml(reason ?? ''));
}

/** Builds a plain-text version from the rendered HTML (improves spam score). */
function toText(html) {
  return html
    .replace(/<(style|head|title|script)[\s\S]*?<\/\1>/gi, '')
    .replace(/<(br|\/p|\/div|\/h[1-6]|\/tr|\/li)\s*\/?>/gi, '\n')
    .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

/** Sends a template email. Never throws: failures are only logged (no personal data). */
async function send(templateName, subject, to, variables) {
  try {
    const template = await loadTemplate(templateName);
    const html = render(template, variables);
    const info = await transporter.sendMail({
      from: mailFrom,
      to,
      subject,
      html,
      text: toText(html),
    });
    console.log(`[email] Sent "${templateName}" id=${info.messageId} accepted=${info.accepted.length} rejected=${info.rejected.length}`);
  } catch (err) {
    console.error(`[email] Could not send "${templateName}": ${err.message}`);
  }
}

export const emailService = {
  /** @param {{firstName: string, email: string}} driver */
  sendPending: (driver) => send('driver-pending', 'Recibimos tu solicitud - AfroGo', driver.email, driver),

  /** @param {{firstName: string, email: string}} driver */
  sendApproved: (driver) => send('driver-approved', '¡Ya eres conductor AfroGo!', driver.email, driver),

  /** @param {{firstName: string, email: string, reason?: string}} driver */
  sendRejected: (driver) => send('driver-rejected', 'Actualización de tu solicitud - AfroGo', driver.email, driver),
};
