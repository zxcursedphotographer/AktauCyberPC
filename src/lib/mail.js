import nodemailer from "nodemailer";

let _transport = null;

function getTransport() {
  if (_transport) return _transport;
  if (!process.env.SMTP_HOST) return null;
  const port = process.env.SMTP_PORT || "465";
  _transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +port,
    secure: port === "465",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return _transport;
}

// Без SMTP_HOST письмо печатается в консоль (удобно для локальной разработки)
export async function sendMail(to, subject, html) {
  const tr = getTransport();
  if (!tr) {
    console.log(`\n[MAIL → ${to}] ${subject}\n${html}\n`);
    return;
  }
  try {
    await tr.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  } catch (e) {
    console.error("MAIL ERROR:", e.message);
  }
}