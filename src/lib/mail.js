import nodemailer from "nodemailer";
// Без SMTP_HOST письмо печатается в консоль (удобно для локальной разработки)
export async function sendMail(to, subject, html) {
  if (!process.env.SMTP_HOST) { console.log(`\n[MAIL → ${to}] ${subject}\n${html}\n`); return; }
  try {
    const port = process.env.SMTP_PORT || "465";
    const tr = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: +port, secure: port === "465", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    await tr.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, html });
  } catch (e) { console.error("MAIL ERROR", e.message); }
}
