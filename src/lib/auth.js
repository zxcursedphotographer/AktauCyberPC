import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";
if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) throw new Error("AUTH_SECRET is required");
const key = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret");

export async function setSession(id) {
  const t = await new SignJWT({ id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(key);
  cookies().set("s", t, { httpOnly: true, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
}
export async function getUser() {
  try {
    const { payload } = await jwtVerify(cookies().get("s")?.value, key);
    const u = await prisma.user.findUnique({ where: { id: payload.id } });
    return u && u.status !== "BANNED" ? u : null;
  } catch { return null; }
}
// Почта считается подтверждённой, если SMTP не настроен (локальная разработка)
export const mailOk = (u) => u.emailVerified || !process.env.SMTP_HOST;
export const isStaff = (u) => u && (u.role === "ADMIN" || u.role === "SUPER_ADMIN");
