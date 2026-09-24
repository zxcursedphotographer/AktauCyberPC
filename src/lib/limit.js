import { headers } from "next/headers";
import { prisma } from "./prisma";
export const ip = () => headers().get("x-forwarded-for")?.split(",")[0].trim() || "local";
// true = действие разрешено; счётчик хранится в БД (работает на serverless)
export async function allow(key, max, seconds) {
  const n = await prisma.rateLog.count({ where: { key, createdAt: { gt: new Date(Date.now() - seconds * 1000) } } });
  if (n >= max) return false;
  await prisma.rateLog.create({ data: { key } });
  if (Math.random() < 0.02) await prisma.rateLog.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 864e5) } } });
  return true;
}
