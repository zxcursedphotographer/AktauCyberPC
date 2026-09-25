"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, AlertTriangle, Send, ImagePlus } from "lucide-react";
import { appealListing } from "@/app/actions";

export default function AppealModal({ listing }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const router = useRouter();

  function close() {
    if (pending) return;
    setOpen(false);
    setError(null);
    setDone(false);
  }

  async function handleSubmit(fd) {
    setError(null);
    const r = await appealListing(fd);
    if (r?.error) {
      setError(r.error);
      return;
    }
    setDone(true);
    startTransition(() => {
      router.refresh();
      setTimeout(close, 1800);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20"
      >
        <Send size={12} /> Исправить и обжаловать
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-10 backdrop-blur-sm"
          onClick={close}
        >
          <div className="card w-full max-w-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold">Апелляция по объявлению</h3>
                <p className="mt-0.5 truncate text-sm opacity-60">{listing.title}</p>
              </div>
              <button
                onClick={close}
                disabled={pending}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {done ? (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center">
                <div className="text-3xl">✅</div>
                <p className="mt-2 font-semibold text-emerald-400">Апелляция отправлена</p>
                <p className="mt-1 text-sm opacity-70">Администрация рассмотрит её и ответит в чате.</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-hot/40 bg-hot/10 p-3 text-sm">
                  <div className="flex items-center gap-1.5 font-semibold text-hot">
                    <AlertTriangle size={14} /> Причина удаления
                  </div>
                  <p className="mt-1 opacity-90">{listing.deletedReason || "не указана"}</p>
                  {listing.deletedAt && (
                    <p className="mt-0.5 text-xs opacity-60">
                      {new Date(listing.deletedAt).toLocaleString("ru")}
                    </p>
                  )}
                </div>

                <form action={handleSubmit} className="space-y-4">
                  <input type="hidden" name="id" value={listing.id} />

                  <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="text-xs font-semibold uppercase tracking-wider opacity-60">
                      Отредактируйте объявление
                    </div>

                    <label className="block text-sm">
                      <span className="mb-1 block text-xs opacity-70">Название</span>
                      <input name="title" defaultValue={listing.title} maxLength={120} className="input" />
                    </label>

                    <label className="block text-sm">
                      <span className="mb-1 block text-xs opacity-70">Описание</span>
                      <textarea
                        name="description"
                        defaultValue={listing.description}
                        rows={5}
                        maxLength={5000}
                        className="input resize-none"
                      />
                    </label>

                    <label className="block text-sm">
                      <span className="mb-1 block text-xs opacity-70">Цена, ₸</span>
                      <input
                        name="price"
                        type="number"
                        defaultValue={listing.price}
                        min={0}
                        max={2000000000}
                        className="input"
                      />
                    </label>

                    <label className="block text-sm">
                      <span className="mb-1 flex items-center gap-1 text-xs opacity-70">
                        <ImagePlus size={12} /> Добавить новые фото (опционально)
                      </span>
                      <input
                        name="photos"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="input !py-1.5 text-xs file:mr-2 file:rounded file:border-0 file:bg-accent/20 file:px-2 file:py-1 file:text-xs file:text-accent"
                      />
                    </label>
                  </div>

                  <label className="block text-sm">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wider opacity-60">
                      Что вы исправили? <span className="text-hot">*</span>
                    </span>
                    <textarea
                      name="message"
                      required
                      rows={3}
                      minLength={10}
                      maxLength={500}
                      placeholder="Опишите, что именно вы изменили…"
                      className="input resize-none"
                    />
                    <span className="mt-1 block text-[11px] opacity-50">
                      Минимум 10 символов. Админ прочитает это и решит, одобрить или отклонить.
                    </span>
                  </label>

                  {error && (
                    <p className="rounded-lg border border-hot/40 bg-hot/10 p-2 text-sm text-hot">{error}</p>
                  )}

                  <div className="flex gap-2 border-t border-white/10 pt-3">
                    <button
                      type="button"
                      onClick={close}
                      disabled={pending}
                      className="flex-1 rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
                    >
                      Отмена
                    </button>
                    <button disabled={pending} className="btn flex-1 justify-center !bg-amber-600">
                      {pending ? "Отправка…" : "Отправить апелляцию"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}