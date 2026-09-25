import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET is required");
}
const key = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret");

const SESSION_DAYS = 7;
const LAST_SEEN_THROTTLE_MS = 120_000;

export async function setSession(id) {
  const t = await new SignJWT({ id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key);
  cookies().set("s", t, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSession() {
  cookies().delete("s");
}

export async function getUser() {
  try {
    const token = cookies().get("s")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, key);
    const u = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!u || u.status === "BANNED") return null;
    if (Date.now() - new Date(u.lastSeen).getTime() > LAST_SEEN_THROTTLE_MS) {
      prisma.user
        .update({ where: { id: u.id }, data: { lastSeen: new Date() } })
        .catch(() => {});
    }
    return u;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const u = await getUser();
  if (!u) throw new Error("Unauthorized");
  return u;
}

export async function requireSuperAdmin() {
  const u = await requireUser();
  if (u.role !== "SUPER_ADMIN") throw new Error("Forbidden");
  return u;
}

// Почта считается подтверждённой, если SMTP не настроен (локальная разработка)
export const mailOk = (u) => u?.emailVerified || !process.env.SMTP_HOST;
export const isStaff = (u) => u && (u.role === "ADMIN" || u.role === "SUPER_ADMIN");
export const isSuperAdmin = (u) => u?.role === "SUPER_ADMIN";