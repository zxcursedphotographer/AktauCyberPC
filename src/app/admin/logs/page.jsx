import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Avatar from "@/components/Avatar";

export const metadata = { title: "Журнал — Админка" };

const ACTION_INFO = {
  DELETE_LISTING: { label: "Удаление объявления", cls: "bg-hot/20 text-hot" },
  ACCOUNT_BANNED: { label: "Блокировка юзера", cls: "bg-hot/20 text-hot" },
  ACCOUNT_ACTIVE: { label: "Разблокировка", cls: "bg-emerald-500/20 text-emerald-400" },
  SEND_TO_REVIEW: { label: "На проверку", cls: "bg-amber-500/20 text-amber-400" },
  CLOSE_REVIEW: { label: "Снят с проверки", cls: "bg-emerald-500/20 text-emerald-400" },
  PRAISE: { label: "Похвала", cls: "bg-emerald-500/20 text-emerald-400" },
  WARN: { label: "Выговор", cls: "bg-hot/20 text-hot" },
  SET_TRUST: { label: "Изменение траста", cls: "bg-accent/20 text-accent" },
  REPORT_CONFIRMED: { label: "Жалоба принята", cls: "bg-emerald-500/20 text-emerald-400" },
  REPORT_REJECTED: { label: "Жалоба отклонена", cls: "bg-slate-500/20 text-slate-400" },
  RESTORE_LISTING: { label: "Восстановление", cls: "bg-emerald-500/20 text-emerald-400" },
  RESET_TRUST: { label: "Сброс траста", cls: "bg-accent/20 text-accent" },
};

export default async function LogsPage({ searchParams }) {
  const typeFilter = searchParams.type || "";

  const where = typeFilter ? { actionType: typeFilter } : {};

  const logs = await prisma.adminLog.findMany({
    where,
    include: { admin: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const types = await prisma.adminLog.groupBy({ by: ["actionType"], _count: { _all: true } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Журнал действий</h1>
        <p className="text-sm opacity-70">Все события администрации</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/logs"
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            !typeFilter ? "bg-accent text-white shadow-lg shadow-accent/30" : "bg-white/5 hover:bg-white/10"
          }`}
        >
          Все
        </Link>
        {types.map((t) => {
          const info = ACTION_INFO[t.actionType] || { label: t.actionType, cls: "bg-white/10" };
          return (
            <Link
              key={t.actionType}
              href={`/admin/logs?type=${t.actionType}`}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                typeFilter === t.actionType ? "bg-accent text-white shadow-lg shadow-accent/30" : "bg-white/5 hover:bg-white/10"
              }`}
            >
              {info.label} ({t._count._all})
            </Link>
          );
        })}
      </div>

      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider opacity-60">
            <tr>
              <th className="p-3 whitespace-nowrap">Время</th>
              <th className="p-3">Админ</th>
              <th className="p-3">Действие</th>
              <th className="p-3">Детали</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((g) => {
              const info = ACTION_INFO[g.actionType] || { label: g.actionType, cls: "bg-white/10" };
              return (
                <tr key={g.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3 whitespace-nowrap text-xs opacity-60">
                    {new Date(g.createdAt).toLocaleString("ru", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="p-3">
                    <Link href={`/u/${g.admin.username}`} className="flex items-center gap-2 hover:underline">
                      <Avatar user={g.admin} size={22} />
                      <span>{g.admin.username}</span>
                    </Link>
                  </td>
                  <td className="p-3">
                    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold ${info.cls}`}>
                      {info.label}
                    </span>
                  </td>
                  <td className="p-3 text-xs opacity-80">
                    {g.reason && <div>Причина: <b>{g.reason}</b></div>}
                    {g.details && <div>{g.details}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {logs.length === 0 && <p className="p-6 text-center text-sm opacity-70">Записей нет.</p>}
      </div>
    </div>
  );
}