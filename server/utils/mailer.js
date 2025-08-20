// server/utils/mailer.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  APP_NAME = 'Flashcard AI',
  APP_URL = 'http://localhost:3000',
  SUPPORT_EMAIL = 'xiaomi13xxx@gmail.com',
} = process.env;

// Khởi tạo transporter một lần
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: String(SMTP_SECURE || 'false') === 'true', // true cho 465, false cho 587
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

// Helper gửi mail
async function sendMail({ to, subject, html, text }) {
  if (!to) throw new Error('Missing recipient email');

  // Nếu thiếu cấu hình SMTP → log cảnh báo nhưng không crash API
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('[mailer] SMTP not configured; skip sending email.');
    return;
  }

  await transporter.sendMail({
    from: `${APP_NAME} <${SUPPORT_EMAIL || SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

function suspendedHtml({ username, reason }) {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6">
    <h2>${APP_NAME} – Thông báo tạm ngưng tài khoản</h2>
    <p>Xin chào <b>${username || 'bạn'}</b>,</p>
    <p>Tài khoản của bạn đã được <b>tạm ngưng (suspended)</b>.</p>
    ${reason ? `<p><b>Lý do:</b> ${reason}</p>` : ''}
    <p>Nếu bạn cho rằng đây là nhầm lẫn, vui lòng phản hồi email này hoặc liên hệ <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
    <p>Thân mến,<br/>Đội ngũ ${APP_NAME}</p>
  </div>`;
}

function reactivatedHtml({ username }) {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6">
    <h2>${APP_NAME} – Tài khoản đã được kích hoạt lại</h2>
    <p>Xin chào <b>${username || 'bạn'}</b>,</p>
    <p>Tài khoản của bạn đã được <b>kích hoạt lại</b>. Bạn có thể đăng nhập tại: <a href="${APP_URL}">${APP_URL}</a>.</p>
    <p>Thân mến,<br/>Đội ngũ ${APP_NAME}</p>
  </div>`;
}

async function sendAccountSuspendedEmail(to, { username, reason } = {}) {
  const subject = `${APP_NAME}: Tài khoản của bạn đã bị tạm ngưng`;
  await sendMail({ to, subject, html: suspendedHtml({ username, reason }) });
}

async function sendAccountReactivatedEmail(to, { username } = {}) {
  const subject = `${APP_NAME}: Tài khoản đã được kích hoạt lại`;
  await sendMail({ to, subject, html: reactivatedHtml({ username }) });
}

module.exports = {
  sendAccountSuspendedEmail,
  sendAccountReactivatedEmail,
};
