import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteListing, restoreListing } from "@/app/actions";
import Avatar from "@/components/Avatar";

export const metadata = { title: "Объявления — Админка" };

const STATUS_BADGE = {
  PUBLISHED: { label: "Активно", cls: "bg-emerald-500/20 text-emerald-400" },
  SOLD: { label: "Продано", cls: "bg-blue-500/20 text-blue-400" },
  DELETED: { label: "Удалено", cls: "bg-slate-500/20 text-slate-400" },
  UNDER_REVIEW: { label: "На проверке", cls: "bg-amber-500/20 text-amber-400" },
  DRAFT: { label: "Черновик", cls: "bg-slate-500/20 text-slate-400" },
};

export default async function AdminListings({ searchParams }) {
  const statusFilter = searchParams.status || "";
  const where = statusFilter ? { status: statusFilter } : {};

  const listings = await prisma.listing.findMany({
    where,
    include: { user: true, images: { take: 1, orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const counts = await prisma.listing.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const total = counts.reduce((sum, c) => sum + c._count._all, 0);

  const filters = [
    { key: "", label: `Все (${total})` },
    { key: "PUBLISHED", label: `Активные (${countMap.PUBLISHED || 0})` },
    { key: "SOLD", label: `Проданные (${countMap.SOLD || 0})` },
    { key: "DELETED", label: `Удалённые (${countMap.DELETED || 0})` },
    { key: "UNDER_REVIEW", label: `На проверке (${countMap.UNDER_REVIEW || 0})` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Объявления</h1>
        <p className="text-sm opacity-70">Всего: {total}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={f.key ? `/admin/listings?status=${f.key}` : "/admin/listings"}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              statusFilter === f.key
                ? "bg-accent text-white shadow-lg shadow-accent/30"
                : "bg-white/5 hover:bg-white/10"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider opacity-60">
            <tr>
              <th className="p-3">Товар</th>
              <th className="p-3">Продавец</th>
              <th className="p-3">Цена</th>
              <th className="p-3">Статус</th>
              <th className="p-3">Причина / Действие</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => {
              const badge = STATUS_BADGE[l.status] || { label: l.status, cls: "bg-white/10" };
              return (
                <tr key={l.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3">
                    <Link href={`/listing/${l.id}`} className="flex items-center gap-2 hover:underline">
                      {l.images[0] ? (
                        <img src={l.images[0].url} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-white/10" />
                      )}
                      <span className="max-w-[240px] truncate">{l.title}</span>
                    </Link>
                  </td>
                  <td className="p-3">
                    <Link href={`/u/${l.user.username}`} className="flex items-center gap-2 hover:underline">
                      <Avatar user={l.user} size={22} />
                      {l.user.username}
                    </Link>
                  </td>
                  <td className="p-3 whitespace-nowrap">{l.price.toLocaleString("ru")} ₸</td>
                  <td className="p-3">
                    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="p-3">
                    {l.status === "DELETED" ? (
                      <div className="flex items-center gap-2">
                        <span className="max-w-[240px] truncate text-xs opacity-60" title={l.deletedReason || ""}>
                          {l.deletedReason || "без причины"}
                        </span>
                        <form action={restoreListing}>
                          <input type="hidden" name="id" value={l.id} />
                          <button className="rounded-lg border border-emerald-500/40 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10">
                            Восстановить
                          </button>
                        </form>
                      </div>
                    ) : (
                      <form action={deleteListing} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={l.id} />
                        <select name="reason" required className="input !w-48 !py-1 !text-xs">
                          <option value="">Причина…</option>
                          <option value="1">Не соответствует проверкам</option>
                          <option value="2">Неправильное оформление</option>
                          <option value="3">Мошенничество</option>
                        </select>
                        <button className="rounded-lg border border-hot/40 px-2 py-1 text-xs text-hot hover:bg-hot/10 whitespace-nowrap">
                          Удалить
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {listings.length === 0 && (
          <p className="p-6 text-center text-sm opacity-70">Объявлений нет.</p>
        )}
      </div>
    </div>
  );
}