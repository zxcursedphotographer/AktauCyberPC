import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Avatar from "@/components/Avatar";
import TrustBadge from "@/components/TrustBadge";
import SearchBar from "@/components/SearchBar";

export const revalidate = 0;

export default async function Home({ searchParams: p }) {
  // Обработка параметров поиска и фильтрации
  const q = p?.q || "";
  const category = p?.category || "";
  const city = p?.city || "";
  const min = p?.priceFrom || p?.min;
  const max = p?.priceTo || p?.max;
  const tmin = p?.tmin || 1;
  const tmax = p?.tmax || 100;
  const sort = p?.sort || "newest";

  // Формируем фильтр Prisma на основе связей и критериев
  const where = {
    status: "PUBLISHED",
    user: {
      status: { not: "BANNED" },
      trustScore: { gte: +tmin, lte: +tmax },
    },
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(category && category !== "ALL" && { category }),
    ...(city && city !== "Весь Казахстан" && { city: { contains: city, mode: "insensitive" } }),
    ...((min || max) && {
      price: {
        ...(min && { gte: +min }),
        ...(max && { lte: +max }),
      },
    }),
  };

  // Настройка сортировки
  let orderBy = { createdAt: "desc" };
  if (sort === "price_asc") {
    orderBy = { price: "asc" };
  } else if (sort === "price_desc") {
    orderBy = { price: "desc" };
  } else if (sort === "oldest") {
    orderBy = { createdAt: "asc" };
  } else if (sort === "views") {
    orderBy = { views: "desc" };
  } else if (sort === "trust") {
    orderBy = { user: { trustScore: "desc" } };
  } else if (sort === "rating") {
    orderBy = { user: { rating: "desc" } };
  }

  const items = await prisma.listing.findMany({
    where,
    orderBy,
    take: 48,
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      tests: { select: { resultStatus: true } },
      user: { select: { username: true, avatarUrl: true, trustScore: true } },
    },
  });

  return (
    <main className="min-h-screen p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Новая скомпонованная панель поиска */}
      <SearchBar />

      {/* Сообщение об отсутствии результатов */}
      {items.length === 0 && (
        <div className="card p-8 text-center text-gray-400">
          Ничего не найдено. Уберите часть фильтров или измените критерии поиска.
        </div>
      )}

      {/* Сетка объявлений */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((l) => (
          <Link
            key={l.id}
            href={`/listing/${l.id}`}
            className="card overflow-hidden !p-0 hover:border-accent transition duration-200"
          >
            {l.images[0] && (
              <img
                src={l.images[0].url}
                alt={l.title}
                className="h-44 w-full object-cover"
              />
            )}
            <div className="p-3">
              <h3 className="font-semibold text-white">{l.title}</h3>
              <p className="text-lg font-bold text-accent">
                {l.price.toLocaleString("ru")} ₸
              </p>
              <p className="text-sm opacity-70">
                {l.city}{l.district ? `, ${l.district}` : ""}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm text-gray-200">
                <Avatar user={l.user} size={24} />
                <span>{l.user.username}</span>
                <TrustBadge score={l.user.trustScore} size={22} />
              </p>
              {l.tests && l.tests.length > 0 && (
                <p className="mt-1 text-xs text-emerald-500">
                  Тестов пройдено:{" "}
                  {l.tests.filter((t) => t.resultStatus === "PASSED").length}/
                  {l.tests.length}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}