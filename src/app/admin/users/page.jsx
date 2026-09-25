import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import Avatar from "@/components/Avatar";
import TrustBadge from "@/components/TrustBadge";
import AdminActionsMenu from "@/components/AdminActionsMenu";

export const metadata = { title: "Пользователи" };

const ROLE_BADGE = {
  USER: { label: "Юзер", cls: "bg-slate-500/20 text-slate-300" },
  ADMIN: { label: "Админ", cls: "bg-blue-500/20 text-blue-400" },
  SUPER_ADMIN: { label: "Владелец", cls: "bg-accent/30 text-accent" },
};

const STATUS_BADGE = {
  ACTIVE: { label: "Активен", cls: "bg-emerald-500/20 text-emerald-400" },
  UNDER_REVIEW: { label: "Проверка", cls: "bg-amber-500/20 text-amber-400" },
  BANNED: { label: "Забанен", cls: "bg-hot/20 text-hot" },
};

export default async function AdminUsers({ searchParams }) {
  const me = await getUser();
  const q = (searchParams.q || "").trim();
  const statusFilter = searchParams.status || "";

  const where = {
    ...(q
      ? {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const [users, counts] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        city: true,
        role: true,
        status: true,
        trustScore: true,
        rating: true,
      },
    }),
    prisma.user.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const total = counts.reduce((s, c) => s + c._count._all, 0);

  const filters = [
    { key: "", label: `Все (${total})` },
    { key: "ACTIVE", label: `Активные (${countMap.ACTIVE || 0})` },
    { key: "UNDER_REVIEW", label: `На проверке (${countMap.UNDER_REVIEW || 0})` },
    { key: "BANNED", label: `Забаненные (${countMap.BANNED || 0})` },
  ];

  // Хелпер для построения URL с сохранением фильтров
  const buildHref = (newStatus) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (newStatus) sp.set("status", newStatus);
    const qs = sp.toString();
    return qs ? `/admin/users?${qs}` : "/admin/users";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <p className="text-sm opacity-70">Всего: {total}</p>
      </div>

      <form className="card flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Поиск по нику или email…"
          className="input min-w-[200px] flex-1"
        />
        {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
        <button className="btn">Найти</button>
        {(q || statusFilter) && (
          <Link
            href="/admin/users"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          >
            Сброс
          </Link>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={buildHref(f.key)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              statusFilter === f.key
                ? "bg-accent font-bold text-slate-950 shadow-lg shadow-accent/30"
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
              <th className="p-3">Пользователь</th>
              <th className="p-3">Город</th>
              <th className="p-3">Траст</th>
              <th className="p-3">Роль</th>
              <th className="p-3">Статус</th>
              <th className="p-3">Рейтинг</th>
              <th className="p-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const role = ROLE_BADGE[u.role] || { label: u.role, cls: "bg-white/10" };
              const status = STATUS_BADGE[u.status] || { label: u.status, cls: "bg-white/10" };
              const isMe = u.id === me.id;
              return (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3">
                    <Link href={`/u/${u.username}`} className="flex items-center gap-2 hover:underline">
                      <Avatar user={u} size={28} />
                      <div className="min-w-0">
                        <div className="font-semibold">
                          {u.username}
                          {isMe && <span className="ml-2 text-xs opacity-60">(вы)</span>}
                        </div>
                        <div className="truncate text-xs opacity-60">{u.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="p-3 text-xs opacity-70">{u.city || "—"}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <TrustBadge score={u.trustScore} size={26} />
                      <span className="text-xs opacity-70">{u.trustScore}/100</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold ${role.cls}`}>
                      {role.label}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold ${status.cls}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="p-3 text-xs opacity-70">★ {u.rating.toFixed(1)}/10</td>
                  <td className="p-3 text-right">
                    {!isMe && <AdminActionsMenu user={u} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-6 text-center text-sm opacity-70">Пользователей нет.</p>}
      </div>
    </div>
  );
}