import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Avatar from "@/components/Avatar";
import TrustBadge from "@/components/TrustBadge";

export const metadata = { title: "Продавцы — AktauCyberPC" };

export default async function Sellers({ searchParams: p }) {
  const order = p.sort === "rating" ? { rating: "desc" } : p.sort === "new" ? { createdAt: "desc" } : { trustScore: "desc" };
  const users = await prisma.user.findMany({
    where: { status: { not: "BANNED" }, listings: { some: { status: "PUBLISHED" } },
      ...(p.q && { username: { contains: p.q, mode: "insensitive" } }), ...(p.city && { city: { contains: p.city, mode: "insensitive" } }) },
    orderBy: order, take: 60, include: { _count: { select: { listings: true } } },
  });
  return (
    <>
      <h1 className="mb-3 text-2xl font-bold">Продавцы</h1>
      <form className="card mb-6 grid gap-2 md:grid-cols-4">
        <input name="q" defaultValue={p.q} placeholder="Ник из TikTok / Telegram" className="input" />
        <input name="city" defaultValue={p.city} placeholder="Город" className="input" />
        <select name="sort" defaultValue={p.sort || "trust"} className="input"><option value="trust">По траст-фактору</option><option value="rating">По рейтингу</option><option value="new">Новые</option></select>
        <button className="btn justify-center">Найти</button>
      </form>
      {users.length === 0 && <p className="card">Продавцы не найдены. Проверьте ник.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => (
          <Link key={u.id} href={`/u/${u.username}`} className="card flex items-center gap-3 hover:border-accent">
            <Avatar user={u} size={56} />
            <div className="min-w-0 flex-1"><b className="block truncate">{u.username}</b>
              <span className="text-sm opacity-70">{u.city || "—"} · ★ {u.rating.toFixed(1)}/10 · {u._count.listings} объявл.</span></div>
            <TrustBadge score={u.trustScore} size={44} />
          </Link>))}
      </div>
    </>
  );
}
