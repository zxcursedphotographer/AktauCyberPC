"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Trash2, X, Eye } from "lucide-react";
import { hideListings, deleteOwnListings, unhideManyListings } from "@/app/actions";

export default function ListingBulkActions({ selectedIds, mode = "active", onClear }) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  if (!selectedIds.length) return null;

  const buildFormData = () => {
    const fd = new FormData();
    selectedIds.forEach((id) => fd.append("ids", id));
    return fd;
  };

  const handleHide = () =>
    startTransition(async () => {
      await hideListings(buildFormData());
      onClear?.();
      router.refresh();
    });

  const handleUnhide = () =>
    startTransition(async () => {
      await unhideManyListings(buildFormData());
      onClear?.();
      router.refresh();
    });

  const handleDelete = () =>
    startTransition(async () => {
      await deleteOwnListings(buildFormData());
      setConfirmDelete(false);
      onClear?.();
      router.refresh();
    });

  return (
    <>
      <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-2xl border border-white/10 bg-panel/95 p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={onClear} className="rounded-lg p-1.5 hover:bg-white/10" title="Снять выделение">
              <X size={16} />
            </button>
            <span className="text-sm font-semibold">
              Выбрано: <span className="text-accent">{selectedIds.length}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {mode === "hidden" ? (
              <button
                onClick={handleUnhide}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-50"
              >
                <Eye size={14} /> Показать
              </button>
            ) : (
              <button
                onClick={handleHide}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/10 disabled:opacity-50"
              >
                <EyeOff size={14} /> Скрыть
              </button>
            )}

            <button
              onClick={() => setConfirmDelete(true)}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-hot/40 px-3 py-1.5 text-xs font-semibold text-hot transition hover:bg-hot/10 disabled:opacity-50"
            >
              <Trash2 size={14} /> Удалить
            </button>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => !pending && setConfirmDelete(false)}
        >
          <div className="card w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Удалить {selectedIds.length} объявлений?</h3>
            <p className="text-sm opacity-70">
              Они уйдут во вкладку «Удалённые». Восстановить можно из профиля.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={pending}
                className="flex-1 rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
              >
                Отмена
              </button>
              <button onClick={handleDelete} disabled={pending} className="btn flex-1 justify-center !bg-hot">
                {pending ? "Удаление…" : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}