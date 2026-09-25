import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Avatar from "@/components/Avatar";
import TrustBadge from "@/components/TrustBadge";
import { CITIES } from "@/lib/constants";

export const metadata = { title: "Продавцы" };

const PAGE_SIZE = 60;

export default async function Sellers({ searchParams: p }) {
  const q = (p.q || "").trim();
  const city = p.city || "";
  const sort = p.sort || "trust";
  const page = Math.max(1, Math.floor(+p.page || 1));
  const skip = (page - 1) * PAGE_SIZE;

  const orderBy =
    sort === "rating" ? { rating: "desc" }
    : sort === "new" ? { createdAt: "desc" }
    : { trustScore: "desc" };

  const where = {
    status: { not: "BANNED" },
    listings: { some: { status: "PUBLISHED" } },
    ...(q ? { username: { contains: q, mode: "insensitive" } } : {}),
    ...(city && city !== "Весь Казахстан" ? { city } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      take: PAGE_SIZE,
      skip,
      include: { _count: { select: { listings: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const buildHref = (targetPage) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (city && city !== "Весь Казахстан") sp.set("city", city);
    if (sort && sort !== "trust") sp.set("sort", sort);
    if (targetPage > 1) sp.set("page", String(targetPage));
    const qs = sp.toString();
    return qs ? `/sellers?${qs}` : "/sellers";
  };

  return (
    <>
      <h1 className="mb-3 text-2xl font-bold">Продавцы</h1>

      <form className="card mb-6 grid gap-2 md:grid-cols-4">
        <input name="q" defaultValue={q} placeholder="Поиск по нику" className="input" />
        <select name="city" defaultValue={city || ""} className="input cursor-pointer">
          <option value="">Весь Казахстан</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} className="input cursor-pointer">
          <option value="trust">По траст-фактору</option>
          <option value="rating">По рейтингу</option>
          <option value="new">Новые</option>
        </select>
        <button className="btn justify-center">Найти</button>
      </form>

      {total > 0 && (
        <p className="mb-3 text-xs text-slate-500">
          Найдено: <b>{total}</b>
          {totalPages > 1 && <span className="ml-1 opacity-70">· стр. {page} из {totalPages}</span>}
        </p>
      )}

      {users.length === 0 && (
        <p className="card text-sm opacity-70">
          {q || city
            ? "Продавцы не найдены по заданным фильтрам."
            : "Пока нет продавцов с активными объявлениями."}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => (
          <Link key={u.id} href={`/u/${u.username}`} className="card flex items-center gap-3 transition hover:border-accent">
            <Avatar user={u} size={56} />
            <div className="min-w-0 flex-1">
              <b className="block truncate">{u.username}</b>
              <span className="text-sm opacity-70">
                {u.city || "—"} · ★ {u.rating.toFixed(1)}/10 · {u._count.listings} объявл.
              </span>
            </div>
            <TrustBadge score={u.trustScore} size={44} />
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-2">
          {hasPrev ? (
            <Link href={buildHref(page - 1)} className="btn">← Назад</Link>
          ) : (
            <span className="btn cursor-not-allowed opacity-40">← Назад</span>
          )}
          <span className="px-3 text-sm text-slate-500">{page} / {totalPages}</span>
          {hasNext ? (
            <Link href={buildHref(page + 1)} className="btn">Вперёд →</Link>
          ) : (
            <span className="btn cursor-not-allowed opacity-40">Вперёд →</span>
          )}
        </nav>
      )}
    </>
  );
}