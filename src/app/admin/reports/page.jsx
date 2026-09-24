import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { resolveReport } from "@/app/actions";
import Avatar from "@/components/Avatar";

export const metadata = { title: "Жалобы — Админка" };

export default async function ReportsPage() {
  const reports = await prisma.report.findMany({
    where: { status: "PENDING" },
    include: { reporter: true, target: true, listing: true },
    orderBy: { createdAt: "desc" },
  });

  const resolved = await prisma.report.findMany({
    where: { status: { in: ["RESOLVED", "REJECTED"] } },
    include: { reporter: true, target: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Жалобы</h1>
        <p className="text-sm opacity-70">Активных: {reports.length}</p>
      </div>

      {reports.length === 0 && (
        <p className="card opacity-70">Активных жалоб нет. Всё чисто ✨</p>
      )}

      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.id} className="card space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Link href={`/u/${r.reporter.username}`} className="flex items-center gap-2 hover:underline">
                <Avatar user={r.reporter} size={28} />
                <b>{r.reporter.username}</b>
              </Link>
              <span className="opacity-50">→</span>
              <Link href={`/u/${r.target.username}`} className="flex items-center gap-2 hover:underline">
                <Avatar user={r.target} size={28} />
                <b>{r.target.username}</b>
              </Link>
              <span className="text-xs opacity-60">{new Date(r.createdAt).toLocaleString("ru")}</span>
            </div>

            <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm">
              <b className="text-amber-400">Причина:</b> {r.reason}
            </p>

            {r.listing && (
              <Link href={`/listing/${r.listing.id}`} className="block text-sm text-accent underline">
                Объявление: {r.listing.title}
              </Link>
            )}

            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
              <form action={resolveReport}>
                <input type="hidden" name="id" value={r.id} />
                <button name="verdict" value="confirm" className="btn !bg-emerald-600">Принять жалобу</button>
              </form>
              <form action={resolveReport}>
                <input type="hidden" name="id" value={r.id} />
                <button name="verdict" value="reject" className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
                  Отклонить
                </button>
              </form>
              <Link
                href={`/chat?u=${r.target.id}`}
                className="rounded-lg border border-accent/40 px-4 py-2 text-sm text-accent hover:bg-accent/10"
              >
                Открыть чат с {r.target.username}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {resolved.length > 0 && (
        <details className="card">
          <summary className="cursor-pointer font-semibold opacity-80">
            Обработанные ({resolved.length})
          </summary>
          <div className="mt-3 space-y-2">
            {resolved.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-2 border-b border-white/5 py-2 text-sm">
                <span className={r.status === "RESOLVED" ? "text-emerald-400" : "opacity-50"}>
                  {r.status === "RESOLVED" ? "✓" : "✕"}
                </span>
                <span>{r.reporter.username} → {r.target.username}</span>
                <span className="opacity-60">· {r.reason}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}