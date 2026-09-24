"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import { deleteChat, blockUser, unblockUser, reportUser } from "@/app/actions";
import { presenceText, isOnline } from "@/lib/presence";

const REPORT_REASONS = [
  "Мошенничество / обман",
  "Оскорбления / грубость",
  "Спам / реклама",
  "Не пришёл на сделку",
  "Другое",
];

export default function ChatHeader({ other, listing, blockedByMe, titleOverride }) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [custom, setCustom] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const online = isOnline(other.lastSeen);

  async function handleReport(fd) {
    setError(null);
    const finalReason = reason === "Другое" ? custom.trim() : `${reason}${custom.trim() ? ` — ${custom.trim()}` : ""}`;
    if (!finalReason) { setError("Опишите проблему"); return; }
    fd.set("targetUserId", other.id);
    fd.set("listingId", listing?.id || "");
    fd.set("reason", finalReason);
    const r = await reportUser(fd);
    if (r?.error) { setError(r.error); return; }
    setDone(true);
    setTimeout(() => { setReportOpen(false); setDone(false); setCustom(""); setReason(REPORT_REASONS[0]); }, 1500);
  }

  return (
    <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
      <div className="relative shrink-0">
        <Avatar user={other} size={36} />
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-panel ${
            online ? "bg-emerald-500" : "bg-slate-500"
          }`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <b className="block truncate">{titleOverride || other.username}</b>
        <span className={`text-xs ${online ? "text-emerald-400" : "opacity-60"}`}>
          {presenceText(other.lastSeen)}
        </span>
        {listing && (
          <>
            <span className="mx-1 text-xs opacity-40">·</span>
            <Link href={`/listing/${listing.id}`} className="text-xs underline opacity-70 hover:opacity-100">
              {listing.title}
            </Link>
          </>
        )}
      </div>

      <Link href={`/u/${other.username}`} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10">
        Профиль
      </Link>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg px-2 py-1 hover:bg-white/10"
          title="Действия"
        >
          ⋮
        </button>
        {open && (
          <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-lg border border-white/10 bg-panel p-1 text-sm shadow-lg">
            <form action={deleteChat}>
              <input type="hidden" name="listingId" value={listing?.id || ""} />
              <input type="hidden" name="otherId" value={other.id} />
              <button className="block w-full rounded px-3 py-2 text-left hover:bg-white/10">
                Удалить переписку (только у меня)
              </button>
            </form>

            <button
              onClick={() => { setReportOpen(true); setOpen(false); }}
              className="block w-full rounded px-3 py-2 text-left text-amber-400 hover:bg-white/10"
            >
              Пожаловаться
            </button>

            {blockedByMe ? (
              <form action={unblockUser}>
                <input type="hidden" name="userId" value={other.id} />
                <button className="block w-full rounded px-3 py-2 text-left hover:bg-white/10">
                  Разблокировать
                </button>
              </form>
            ) : (
              <form action={blockUser}>
                <input type="hidden" name="userId" value={other.id} />
                <button className="block w-full rounded px-3 py-2 text-left text-hot hover:bg-white/10">
                  Заблокировать
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setReportOpen(false)}>
          <div className="card w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Жалоба на {other.username}</h3>
            {done ? (
              <p className="rounded bg-emerald-500/20 p-3 text-sm text-emerald-400">
                ✅ Жалоба отправлена. Администрация рассмотрит её в ближайшее время.
              </p>
            ) : (
              <form action={handleReport} className="space-y-3">
                <div className="space-y-1.5">
                  {REPORT_REASONS.map((r) => (
                    <label key={r} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm hover:bg-white/5">
                      <input
                        type="radio"
                        name="reasonRadio"
                        value={r}
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="accent-accent"
                      />
                      {r}
                    </label>
                  ))}
                </div>

                <textarea
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder={reason === "Другое" ? "Опишите проблему (обязательно)" : "Комментарий (необязательно)"}
                  className="input"
                />

                {error && <p className="text-sm text-hot">{error}</p>}

                <div className="flex gap-2">
                  <button type="button" onClick={() => setReportOpen(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm flex-1">
                    Отмена
                  </button>
                  <button disabled={pending} className="btn flex-1 justify-center !bg-amber-600">
                    {pending ? "Отправка…" : "Отправить жалобу"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}