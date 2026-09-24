// node prisma/promote.js ваша@почта  -> делает вас SUPER_ADMIN и удаляет демо-аккаунты (@demo.dev)
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const email = (process.argv[2] || "").toLowerCase();
  if (!email) return console.log("Использование: node prisma/promote.js ваша@почта");
  const u = await db.user.update({ where: { email }, data: { role: "SUPER_ADMIN", emailVerified: true, trustScore: 100 } });
  await db.adminLog.deleteMany({ where: { admin: { email: { endsWith: "@demo.dev" } } } });
  const d = await db.user.deleteMany({ where: { email: { endsWith: "@demo.dev" } } });
  console.log(`${u.username} теперь SUPER_ADMIN. Демо-аккаунтов удалено: ${d.count}`);
})().finally(() => db.$disconnect());
