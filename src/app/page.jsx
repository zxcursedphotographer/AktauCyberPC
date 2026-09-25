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
      {/* Панель поиска */}
      <SearchBar />

      {/* Сообщение об отсутствии результатов */}
      {items.length === 0 && (
        <div className="card p-8 text-center text-slate-500 dark:text-slate-400">
          Ничего не найдено. Уберите часть фильтров или измените критерии поиска.
        </div>
      )}

      {/* Сетка объявлений */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((l) => (
          <Link
            key={l.id}
            href={`/listing/${l.id}`}
            className="card overflow-hidden !p-3 hover:border-accent/50 hover:shadow-lg transition duration-200 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Контейнер фото с аккуратной рамкой */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800/80">
                {l.images[0] ? (
                  <>
                    <img
                      src={l.images[0].url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover blur-md opacity-30 scale-110"
                    />
                    <img
                      src={l.images[0].url}
                      alt={l.title}
                      className="relative h-full w-full object-contain group-hover:scale-105 transition duration-300 ease-out"
                    />
                  </>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs font-medium">
                    Нет фотографии
                  </div>
                )}
              </div>

              {/* Текстовая информация */}
              <div className="space-y-1">
                <p className="text-lg font-black text-accent">
                  {l.price.toLocaleString("ru")} ₸
                </p>

                <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug text-sm">
                  {l.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {l.city}{l.district ? `, ${l.district}` : ""}
                </p>
              </div>
            </div>

            {/* Подвал карточки: Продавец и тесты */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar user={l.user} size={22} />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                  {l.user.username}
                </span>
                <TrustBadge score={l.user.trustScore} size={18} />
              </div>

              {l.tests && l.tests.length > 0 && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                  {l.tests.filter((t) => t.resultStatus === "PASSED").length}/{l.tests.length}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}