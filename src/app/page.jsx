import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Search } from "lucide-react";
import Avatar from "@/components/Avatar";
import TrustBadge from "@/components/TrustBadge";

import { CATS } from "@/lib/constants";

export default async function Home({ searchParams: p }) {
  const where = {
    status: "PUBLISHED", user: { status: { not: "BANNED" }, trustScore: { gte: +(p.tmin || 1), lte: +(p.tmax || 100) } },
    ...(p.q && { title: { contains: p.q, mode: "insensitive" } }),
    ...(p.category && { category: p.category }),
    ...(p.city && { city: { contains: p.city, mode: "insensitive" } }),
    ...((p.min || p.max) && { price: { ...(p.min && { gte: +p.min }), ...(p.max && { lte: +p.max }) } }),
  };
  const items = await prisma.listing.findMany({ where, orderBy: { createdAt: "desc" }, take: 48, include: { images: { orderBy: { order: "asc" }, take: 1 }, tests: { select: { resultStatus: true } }, user: { select: { username: true, avatarUrl: true, trustScore: true } } } });
  return (
    <>
      <form className="card mb-6 grid gap-2 md:grid-cols-8">
        <div className="relative md:col-span-2"><Search size={16} className="absolute left-3 top-2.5 opacity-50" /><input name="q" defaultValue={p.q} placeholder="RTX 3070, Ryzen…" className="input pl-9" /></div>
        <select name="category" defaultValue={p.category || ""} className="input"><option value="">Все категории</option>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
        <input name="city" defaultValue={p.city} placeholder="Город" className="input" />
        <div className="flex gap-1"><input name="min" type="number" defaultValue={p.min} placeholder="от ₸" className="input" /><input name="max" type="number" defaultValue={p.max} placeholder="до ₸" className="input" /></div>
        <div className="flex gap-1"><input name="tmin" type="number" min={1} max={100} defaultValue={p.tmin} placeholder="траст от" className="input" /><input name="tmax" type="number" min={1} max={100} defaultValue={p.tmax} placeholder="до 100" className="input" /></div>
        <div className="flex gap-2 md:col-span-2"><button className="btn justify-center">Найти</button><Link href="/new" className="btn !bg-hot justify-center whitespace-nowrap">+ Создать объявление</Link></div>
      </form>
      {items.length === 0 && <p className="card">Ничего не найдено. Уберите часть фильтров.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((l) => (
          <Link key={l.id} href={`/listing/${l.id}`} className="card overflow-hidden !p-0 hover:border-accent">
            {l.images[0] && <img src={l.images[0].url} alt={l.title} className="h-44 w-full object-cover" />}
            <div className="p-3">
              <h3 className="font-semibold">{l.title}</h3>
              <p className="text-lg font-bold text-accent">{l.price.toLocaleString("ru")} ₸</p>
              <p className="text-sm opacity-70">{l.city}, {l.district}</p>
              <p className="mt-2 flex items-center gap-2 text-sm"><Avatar user={l.user} size={24} />{l.user.username}<TrustBadge score={l.user.trustScore} size={22} /></p>
              {l.tests.length > 0 && <p className="mt-1 text-xs text-emerald-500">Тестов пройдено: {l.tests.filter((t) => t.resultStatus === "PASSED").length}/{l.tests.length}</p>}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
