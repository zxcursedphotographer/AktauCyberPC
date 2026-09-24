import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUser, isStaff } from "@/lib/auth";
import { deleteListing, setAccountStatus, resolveReport, sendToReview, closeReview, adjustTrust } from "@/app/actions";
import Avatar from "@/components/Avatar";

export default async function Admin() {
  const me = await getUser(); if (!isStaff(me)) redirect("/");
  const sa = me.role === "SUPER_ADMIN";
  const [reports, listings, users, logs] = await Promise.all([
    prisma.report.findMany({ where: { status: "PENDING" }, include: { reporter: true, target: true } }),
    prisma.listing.findMany({ orderBy: { createdAt: "desc" }, include: { user: true }, take: 100 }),
    sa ? prisma.user.findMany({ orderBy: { createdAt: "desc" } }) : [],
    sa ? prisma.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: 15, include: { admin: true } }) : [],
  ]);
  const byCity = {};
  users.forEach((u) => (byCity[u.city || "Без города"] ||= []).push(u));

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-2 text-lg font-bold">Жалобы ({reports.length})</h2>
        {reports.map((r) => (
          <form key={r.id} action={resolveReport} className="card mb-2 flex flex-wrap items-center gap-3 text-sm">
            <input type="hidden" name="id" value={r.id} />
            <span className="flex-1">{r.reporter.username} → <b>{r.target.username}</b>: {r.reason}</span>
            <button name="verdict" value="confirm" className="btn">Подтвердить</button>
            <button name="verdict" value="reject" className="rounded-lg border border-white/20 px-3 py-2">Отклонить</button>
          </form>
        ))}
        {reports.length === 0 && <p className="text-sm opacity-70">Жалоб нет.</p>}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Объявления</h2>
        {listings.map((l) => (
          <div key={l.id} className="card mb-2 flex flex-wrap items-center gap-3 text-sm">
            <Link href={`/listing/${l.id}`} className="flex-1 underline">
              {l.title} · {l.user.username} · {l.status}
            </Link>
            {sa && (
              <form action={deleteListing} className="flex gap-2">
                <input type="hidden" name="id" value={l.id} />
                <select name="reason" required className="input !w-64">
                  <option value="">Причина удаления…</option>
                  <option value="1">Не соответствует проверкам / недействительные тесты</option>
                  <option value="2">Неправильное оформление объявления</option>
                  <option value="3">Мошенничество или неадекватное поведение</option>
                </select>
                <button className="btn !bg-hot">Удалить</button>
              </form>
            )}
          </div>
        ))}
      </section>

      {sa && (
        <section>
          <h2 className="mb-2 text-lg font-bold">Пользователи</h2>
          {Object.entries(byCity).map(([city, list]) => (
            <details key={city} open className="mb-3">
              <summary className="cursor-pointer py-1 font-semibold">{city} ({list.length})</summary>
              {list.map((u) => (
                <div key={u.id} className="card mb-2 flex flex-wrap items-center gap-3 text-sm">
                  <Link href={`/u/${u.username}`} className="flex flex-1 items-center gap-2 underline">
                    <Avatar user={u} size={28} />{u.username}
                  </Link>
                  <span className="opacity-70">траст {u.trustScore} · {u.role} · {u.status}</span>

                  {u.status === "BANNED" ? (
                    <form action={setAccountStatus}>
                      <input type="hidden" name="id" value={u.id} />
                      <button name="status" value="ACTIVE" className="btn">Разблокировать</button>
                    </form>
                  ) : u.id !== me.id ? (
                    <form action={setAccountStatus}>
                      <input type="hidden" name="id" value={u.id} />
                      <button name="status" value="BANNED" className="btn !bg-hot">Заблокировать</button>
                    </form>
                  ) : null}

                  {u.id !== me.id && (
                    <>
                      <form action={sendToReview}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="rounded-lg border border-white/20 px-2.5 py-1 hover:bg-white/10">
                          На проверку
                        </button>
                      </form>

                      {u.status === "UNDER_REVIEW" && (
                        <form action={closeReview}>
                          <input type="hidden" name="id" value={u.id} />
                          <button className="rounded-lg border border-emerald-500/40 px-2.5 py-1 text-emerald-400 hover:bg-emerald-500/10">
                            Снять с проверки
                          </button>
                        </form>
                      )}

                      <form action={adjustTrust}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="delta" value="5" />
                        <button className="rounded-lg border border-emerald-500/40 px-2.5 py-1 text-emerald-400 hover:bg-emerald-500/10">
                          Похвала +5
                        </button>
                      </form>

                      <form action={adjustTrust}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="delta" value="-5" />
                        <button className="rounded-lg border border-hot/40 px-2.5 py-1 text-hot hover:bg-hot/10">
                          Выговор −5
                        </button>
                      </form>

                      <Link
                        href={`/u/${u.username}#reviews`}
                        className="rounded-lg border border-accent/40 px-2.5 py-1 text-accent hover:bg-accent/10"
                      >
                        Оставить отзыв
                      </Link>
                    </>
                  )}
                </div>
              ))}
            </details>
          ))}

          <h2 className="mb-2 mt-6 text-lg font-bold">Журнал действий</h2>
          {logs.map((g) => (
            <p key={g.id} className="text-sm opacity-80">
              {g.createdAt.toLocaleString("ru")} · {g.admin.username} · {g.actionType} · {g.reason || g.details || ""}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}