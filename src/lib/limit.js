import { headers } from "next/headers";
import { prisma } from "./prisma";

export const ip = () =>
  headers().get("x-forwarded-for")?.split(",")[0].trim() ||
  headers().get("x-real-ip") ||
  "local";

// true = действие разрешено; счётчик хранится в БД (работает на serverless)
export async function allow(key, max, seconds) {
  const since = new Date(Date.now() - seconds * 1000);
  const n = await prisma.rateLog.count({ where: { key, createdAt: { gt: since } } });
  if (n >= max) return false;
  await prisma.rateLog.create({ data: { key } });
  // 2% chance cleanup of records older than 24h
  if (Math.random() < 0.02) {
    await prisma.rateLog.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 86_400_000) } },
    });
  }
  return true;
}