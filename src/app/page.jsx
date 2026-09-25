import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Avatar from "@/components/Avatar";
import TrustBadge from "@/components/TrustBadge";
import SearchBar from "@/components/SearchBar";

export const revalidate = 30;

const PAGE_SIZE = 48;

export default async function Home({ searchParams: p }) {
  // Параметры фильтра
  const q = (p?.q || "").trim();
  const category = p?.category || "";
  const city = p?.city || "";
  const min = p?.priceFrom ?? p?.min;
  const max = p?.priceTo ?? p?.max;
  const tmin = Math.min(100, Math.max(1, +p?.tmin || 1));
  const tmax = Math.min(100, Math.max(1, +p?.tmax || 100));
  const sort = p?.sort || "newest";
  const page = Math.max(1, Math.floor(+p?.page || 1));
  const skip = (page - 1) * PAGE_SIZE;

  // Диапазон цены
  const priceWhere = {};
  if (min != null && min !== "") priceWhere.gte = Math.max(0, +min);
  if (max != null && max !== "") priceWhere.lte = Math.max(0, +max);

  // Основной where
  const where = {
    status: "PUBLISHED",
    user: {
      status: { not: "BANNED" },
      ...(tmin > 1 || tmax < 100 ? { trustScore: { gte: tmin, lte: tmax } } : {}),
    },
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(category && category !== "ALL" && { category }),
    ...(city && city !== "Весь Казахстан" && { city }),
    ...(Object.keys(priceWhere).length > 0 && { price: priceWhere }),
  };

  // Сортировка
  const sortMap = {
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    price_asc: { price: "asc" },
    price_desc: { price: "desc" },
    views: { viewsCount: "desc" },
  };
  const orderBy = sortMap[sort] || sortMap.newest;

  // Параллельно: список + общее количество
  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      take: PAGE_SIZE,
      skip,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        tests: { select: { resultStatus: true } },
        user: { select: { username: true, avatarUrl: true, trustScore: true } },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  // Хелпер: собрать URL с текущими фильтрами
  const buildPageHref = (targetPage) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (category && category !== "ALL") sp.set("category", category);
    if (city && city !== "Весь Казахстан") sp.set("city", city);
    if (min != null && min !== "") sp.set("priceFrom", String(min));
    if (max != null && max !== "") sp.set("priceTo", String(max));
    if (tmin > 1) sp.set("tmin", String(tmin));
    if (tmax < 100) sp.set("tmax", String(tmax));
    if (sort && sort !== "newest") sp.set("sort", sort);
    if (targetPage > 1) sp.set("page", String(targetPage));
    const qs = sp.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-6 p-4 lg:p-8">
      {/* Панель поиска */}
      <SearchBar />

      {/* Счётчик результатов */}
      {items.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Найдено: <b className="text-slate-700 dark:text-slate-300">{total}</b>
          {total > PAGE_SIZE && (
            <span className="ml-1 opacity-70">
              · стр. {page} из {totalPages}
            </span>
          )}
        </p>
      )}

      {/* Сообщение об отсутствии результатов */}
      {items.length === 0 && (
        <div className="card p-8 text-center text-slate-500 dark:text-slate-400">
          {q || category || city ? (
            <>
              Ничего не найдено по вашему запросу.
              <br />
              <Link href="/" className="mt-2 inline-block text-accent underline">
                Сбросить все фильтры
              </Link>
            </>
          ) : (
            <>
              Пока нет ни одного объявления.
              <br />
              <Link href="/new" className="btn mt-3 inline-flex">
                + Создать первое объявление
              </Link>
            </>
          )}
        </div>
      )}

      {/* Сетка объявлений */}
      {items.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((l) => (
            <Link
              key={l.id}
              href={`/listing/${l.id}`}
              className="card group flex flex-col justify-between overflow-hidden !p-3 transition duration-200 hover:border-accent/50 hover:shadow-lg"
            >
              <div className="space-y-3">
                {/* Контейнер фото */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800/80">
                  {l.images[0] ? (
                    <>
                      <img
                        src={l.images[0].url}
                        alt=""
                        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-md"
                      />
                      <img
                        src={l.images[0].url}
                        alt={l.title}
                        className="relative h-full w-full object-contain transition duration-300 ease-out group-hover:scale-105"
                      />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-400">
                      Нет фотографии
                    </div>
                  )}
                </div>

                {/* Текстовая информация */}
                <div className="space-y-1">
                  <p className="text-lg font-black text-accent">
                    {l.price.toLocaleString("ru")} ₸
                  </p>

                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
                    {l.title}
                  </h3>

                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {l.city}
                    {l.district ? `, ${l.district}` : ""}
                  </p>
                </div>
              </div>

              {/* Подвал карточки */}
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 dark:border-white/5">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar user={l.user} size={22} />
                  <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                    {l.user.username}
                  </span>
                  <TrustBadge score={l.user.trustScore} size={18} />
                </div>

                {l.tests && l.tests.length > 0 && (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                    {l.tests.filter((t) => t.resultStatus === "PASSED").length}/{l.tests.length}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 pt-4">
          {hasPrev ? (
            <Link href={buildPageHref(page - 1)} className="btn">
              ← Назад
            </Link>
          ) : (
            <span className="btn cursor-not-allowed opacity-40">← Назад</span>
          )}

          <span className="px-3 text-sm text-slate-500 dark:text-slate-400">
            {page} / {totalPages}
          </span>

          {hasNext ? (
            <Link href={buildPageHref(page + 1)} className="btn">
              Вперёд →
            </Link>
          ) : (
            <span className="btn cursor-not-allowed opacity-40">Вперёд →</span>
          )}
        </nav>
      )}
    </main>
  );
}