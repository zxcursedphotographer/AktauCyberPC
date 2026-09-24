const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const db = new PrismaClient();

async function main() {
  await db.adminLog.deleteMany(); await db.message.deleteMany(); await db.report.deleteMany();
  await db.listing.deleteMany(); await db.user.deleteMany();
  const passwordHash = await bcrypt.hash("password123", 10);
  const mk = (username, role, extra = {}) =>
    db.user.create({ data: { email: `${username}@demo.dev`, username, passwordHash, role, country: "Казахстан", emailVerified: true, ...extra } });

  const owner = await mk("owner", "SUPER_ADMIN", { trustScore: 100, city: "Астана", district: "Есиль" });
  const moder = await mk("moder", "ADMIN", { city: "Актау", district: "Бостандык" });
  const seller = await mk("gpu_dealer", "USER", { city: "Актау", district: "Ауэзов", rating: 7.3, trustScore: 87 });
  const buyer = await mk("buyer", "USER", { city: "Актау", district: "Медеу" });

  await db.listing.create({ data: {
    title: "RTX 3070 Gigabyte Gaming OC", category: "Видеокарты", price: 145000, city: "Актау", district: "Ауэзов", userId: seller.id,
    description: "Куплена в 2021, не майнила. Термопрокладки не менялись, стресс-тест пройден.",
    images: { create: [{ url: "https://picsum.photos/seed/gpu1/900/600", order: 0 }, { url: "https://picsum.photos/seed/gpu2/900/600", order: 1 }] },
    tests: { create: [
      { componentType: "GPU", testTitle: "FurMark 30 мин + Superposition 4K", resultStatus: "PASSED", mediaUrls: [],
        metrics: { "Средний FPS (Superposition)": 62, "Score": 9820, "Температура GPU, °C": 71, "Hot Spot, °C": 83, "Майнинг": "Не использовалась", temps: [48, 62, 68, 70, 71, 71, 70] } },
      { componentType: "CPU", testTitle: "OCCT 20 мин", resultStatus: "PASSED", mediaUrls: [], metrics: { "Макс. температура, °C": 76, "Ошибки": 0 } } ] } } });

  await db.listing.create({ data: {
    title: "Samsung 970 EVO Plus 1TB", category: "Накопители (SSD/HDD)", price: 32000, city: "Актау", district: "Ауэзов", userId: seller.id,
    description: "Снят из рабочего ПК. Данные S.M.A.R.T. на скриншоте.",
    images: { create: [{ url: "https://picsum.photos/seed/ssd1/900/600", order: 0 }] },
    tests: { create: [{ componentType: "STORAGE", testTitle: "CrystalDiskInfo", resultStatus: "PASSED", mediaUrls: [],
      metrics: { "Здоровье, %": 94, "Часы работы": 6120, "Записано, TB": 41.3, "Переназначенные секторы": 0 } }] } } });
  await db.review.createMany({ data: [
    { authorId: owner.id, targetId: seller.id, rating: 10, pinned: true, text: "Покупал у него сам. Всё честно, железо как в описании." },
    { authorId: buyer.id, targetId: seller.id, rating: 9, text: "Карта без косяков, встреча вовремя." },
    { authorId: moder.id, targetId: seller.id, rating: 3, text: "Опоздал на встречу на час." } ] });
  console.log("Seed ok. Логин любого: owner@demo.dev / password123");
}
main().finally(() => db.$disconnect());
