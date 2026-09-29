import { createHmac, timingSafeEqual } from "crypto";

// Капча подписывается сервером: клиент не может подставить свои числа.
const secret = () => process.env.AUTH_SECRET || "dev-secret";
const sign = (a, b, t) =>
  createHmac("sha256", secret()).update(`captcha:${a}:${b}:${t}`).digest("hex");

export function makeCaptcha() {
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  const t = Date.now();
  return { a, b, t, sig: sign(a, b, t) };
}

export function checkCaptcha(f) {
  const a = Number(f.get("a"));
  const b = Number(f.get("b"));
  const t = Number(f.get("t"));
  const sig = String(f.get("sig") || "");
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(t)) return false;
  if (Date.now() - t > 3600e3 || t > Date.now() + 60e3) return false;
  const expected = sign(a, b, t);
  if (sig.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  return a + b === Number(f.get("answer"));
}
