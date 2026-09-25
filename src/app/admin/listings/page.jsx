import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  deleteListing,
  restoreListing,
  approveAppeal,
  rejectAppeal,
  approveListing,
  requestListingChanges,
  rejectListing,
  setTestResult,
} from "@/app/actions";
import Avatar from "@/components/Avatar";
import { Check, X, Pencil, ShieldCheck } from "lucide-react";

export const metadata = { title: "Объявления — Админка" };

const STATUS_BADGE = {
  PUBLISHED: { label: "Активно", cls: "bg-emerald-500/20 text-emerald-400" },
  SOLD: { label: "Продано", cls: "bg-blue-500/20 text-blue-400" },
  DELETED: { label: "Удалено", cls: "bg-slate-500/20 text-slate-400" },
  UNDER_REVIEW: { label: "На проверке", cls: "bg-amber-500/20 text-amber-400" },
  NEEDS_EDIT: { label: "Требует правок", cls: "bg-orange-500/20 text-orange-400" },
  DRAFT: { label: "Черновик", cls: "bg-slate-500/20 text-slate-400" },
  APPEAL: { label: "Апелляция", cls: "bg-amber-500/30 text-amber-300" },
  HIDDEN: { label: "Скрыто", cls: "bg-slate-500/20 text-slate-400" },
};

const CHANGE_REASONS = [
  "Неправильное название — уточните модель/характеристики",
  "Мало информации в описании — добавьте детали",
  "Некачественные фото — загрузите чёткие снимки",
  "Тесты оформлены неверно — приложите скриншоты программ",
  "Завышенная цена — укажите реалистичную стоимость",
  "Другое — смотрите комментарий ниже",
];

export default async function AdminListings({ searchParams }) {
  const statusFilter = searchParams.status || "";
  const where = statusFilter ? { status: statusFilter } : {};

  const listings = await prisma.listing.findMany({
    where,
    include: {
      user: true,
      images: { take: 1, orderBy: { order: "asc" } },
      tests: true,
    },
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
    { key: "UNDER_REVIEW", label: `На проверке (${countMap.UNDER_REVIEW || 0})`, highlight: "amber" },
    { key: "NEEDS_EDIT", label: `На правках (${countMap.NEEDS_EDIT || 0})`, highlight: "orange" },
    { key: "PUBLISHED", label: `Активные (${countMap.PUBLISHED || 0})` },
    { key: "APPEAL", label: `Апелляции (${countMap.APPEAL || 0})`, highlight: "amber" },
    { key: "SOLD", label: `Проданные (${countMap.SOLD || 0})` },
    { key: "DELETED", label: `Удалённые (${countMap.DELETED || 0})` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Объявления</h1>
        <p className="text-sm opacity-70">Всего: {total}</p>
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = statusFilter === f.key;
          const highlightCls =
            f.highlight === "amber" && (countMap[f.key] || 0) > 0 && !active
              ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
              : f.highlight === "orange" && (countMap[f.key] || 0) > 0 && !active
                ? "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"
                : "bg-white/5 hover:bg-white/10";
          return (
            <Link
              key={f.key}
              href={f.key ? `/admin/listings?status=${f.key}` : "/admin/listings"}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                active ? "bg-accent text-white shadow-lg shadow-accent/30" : highlightCls
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Таблица */}
      <div className="card overflow-x-auto !p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider opacity-60">
            <tr>
              <th className="p-3">Товар</th>
              <th className="p-3">Продавец</th>
              <th className="p-3">Цена</th>
              <th className="p-3">Статус</th>
              <th className="p-3">Тесты</th>
              <th className="p-3">Причина / Действие</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => {
              const badge = STATUS_BADGE[l.status] || { label: l.status, cls: "bg-white/10" };
              return (
                <tr key={l.id} className="border-b border-white/5 align-top hover:bg-white/5">
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

                  {/* Тесты — управление PASSED/FAILED */}
                  <td className="p-3">
                    {l.tests.length === 0 ? (
                      <span className="text-xs opacity-50">нет</span>
                    ) : (
                      <div className="space-y-1">
                        {l.tests.map((t) => (
                          <form key={t.id} action={setTestResult} className="flex items-center gap-1">
                            <input type="hidden" name="testId" value={t.id} />
                            <select
                              name="result"
                              defaultValue={t.resultStatus}
                              className={`input !w-24 !py-0.5 !text-xs ${
                                t.resultStatus === "PASSED"
                                  ? "!border-emerald-500/40 !text-emerald-400"
                                  : "!border-hot/40 !text-hot"
                              }`}
                            >
                              <option value="PASSED">✅ Пройден</option>
                              <option value="FAILED">❌ Не пройден</option>
                            </select>
                            <button className="rounded border border-white/20 px-1.5 py-0.5 text-[10px] hover:bg-white/10">
                              OK
                            </button>
                          </form>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Действия по статусу */}
                  <td className="p-3">
                    {/* UNDER_REVIEW — модерация */}
                    {l.status === "UNDER_REVIEW" && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <form action={approveListing}>
                            <input type="hidden" name="id" value={l.id} />
                            <button className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20">
                              <Check size={12} /> Одобрить
                            </button>
                          </form>

                          <details className="inline-block">
                            <summary className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-orange-500/40 bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-400 hover:bg-orange-500/20">
                              <Pencil size={12} /> Вернуть на изменение
                            </summary>
                            <form action={requestListingChanges} className="mt-2 space-y-2 rounded-lg border border-orange-500/30 bg-orange-500/5 p-2">
                              <input type="hidden" name="id" value={l.id} />
                              <select name="note" required className="input !w-full !py-1 !text-xs">
                                <option value="">Выберите причину…</option>
                                {CHANGE_REASONS.map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                              <input
                                name="note"
                                placeholder="Свой комментарий (опционально)"
                                className="input !w-full !py-1 !text-xs"
                              />
                              <button className="btn w-full !bg-orange-600 !py-1 !text-xs">
                                Отправить на доработку
                              </button>
                            </form>
                          </details>
                        </div>

                        <form action={rejectListing} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={l.id} />
                          <select name="reason" required className="input !w-48 !py-1 !text-xs">
                            <option value="">Отклонить — причина…</option>
                            <option value="1">Не соответствует проверкам</option>
                            <option value="2">Неправильное оформление</option>
                            <option value="3">Мошенничество</option>
                          </select>
                          <button className="inline-flex items-center gap-1 rounded-lg border border-hot/40 px-2.5 py-1 text-xs font-semibold text-hot hover:bg-hot/10">
                            <X size={12} /> Отклонить
                          </button>
                        </form>
                      </div>
                    )}

                    {/* NEEDS_EDIT — ждём от юзера */}
                    {l.status === "NEEDS_EDIT" && (
                      <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-2 text-xs">
                        <b className="block text-orange-300">Ждём правок от юзера</b>
                        {l.moderationNote && (
                          <span className="mt-1 block opacity-80">
                            Причина: {l.moderationNote}
                          </span>
                        )}
                      </div>
                    )}

                    {/* APPEAL */}
                    {l.status === "APPEAL" && (
                      <div className="space-y-2">
                        <div className="rounded-lg border border-hot/30 bg-hot/5 p-2 text-xs">
                          <b className="block text-hot">Изначальная причина:</b>
                          <span className="opacity-90">{l.previousReason || l.deletedReason || "не указана"}</span>
                        </div>
                        {l.appealMessage && (
                          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2 text-xs">
                            <b className="block text-amber-300">Комментарий юзера:</b>
                            <span className="opacity-90">{l.appealMessage}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <form action={approveAppeal}>
                            <input type="hidden" name="id" value={l.id} />
                            <button className="rounded-lg border border-emerald-500/40 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10">
                              ✅ Одобрить
                            </button>
                          </form>
                          <form action={rejectAppeal} className="flex items-center gap-1">
                            <input type="hidden" name="id" value={l.id} />
                            <select name="reason" required className="input !w-44 !py-1 !text-xs">
                              <option value="">Причина…</option>
                              <option value="1">Не соответствует проверкам</option>
                              <option value="2">Неправильное оформление</option>
                              <option value="3">Мошенничество</option>
                            </select>
                            <button className="rounded-lg border border-hot/40 px-2 py-1 text-xs text-hot hover:bg-hot/10">
                              ❌ Отклонить
                            </button>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* DELETED */}
                    {l.status === "DELETED" && (
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
                    )}

                    {/* PUBLISHED / SOLD / DRAFT / HIDDEN — быстрое удаление */}
                    {(l.status === "PUBLISHED" || l.status === "SOLD" || l.status === "DRAFT" || l.status === "HIDDEN") && (
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