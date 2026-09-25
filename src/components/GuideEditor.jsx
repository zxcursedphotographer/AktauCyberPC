"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Save, Trash2, ExternalLink } from "lucide-react";
import { saveGuideVideo, clearGuideVideo } from "@/app/actions";

export default function GuideEditor({ item, isAdmin }) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(item.videoUrl || "");
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSave(fd) {
    setError(null);
    try {
      await saveGuideVideo(fd);
      setEditing(false);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e.message || "Ошибка сохранения");
    }
  }

  async function handleClear() {
    if (!confirm("Удалить ссылку на видео для этого компонента?")) return;
    const fd = new FormData();
    fd.append("id", item.id);
    try {
      await clearGuideVideo(fd);
      setUrl("");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e.message);
    }
  }

  function cancel() {
    setEditing(false);
    setUrl(item.videoUrl || "");
    setError(null);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-semibold">{item.title}</span>

        <div className="flex flex-wrap items-center gap-2">
          {item.videoUrl ? (
            <a
              href={item.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn text-xs"
            >
              <ExternalLink size={14} /> Смотреть видео
            </a>
          ) : (
            <span className="text-sm text-slate-500">скоро</span>
          )}

          {isAdmin && !editing && (
            <button
              onClick={() => { setEditing(true); setError(null); }}
              className="inline-flex items-center gap-1 rounded-lg border border-accent/40 px-2.5 py-1 text-xs font-semibold text-accent hover:bg-accent/10"
            >
              <Pencil size={12} />
              {item.videoUrl ? "Изменить" : "Добавить"}
            </button>
          )}
        </div>
      </div>

      {isAdmin && editing && (
        <form
          action={handleSave}
          className="mt-3 space-y-2 rounded-lg border border-accent/30 bg-accent/5 p-3"
        >
          <input type="hidden" name="id" value={item.id} />
          <label className="block text-xs font-semibold uppercase tracking-wider text-accent">
            Ссылка на YouTube
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              name="videoUrl"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtu.be/..."
              required
              className="input min-w-[200px] flex-1 text-sm"
              autoFocus
            />
            <button
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              <Save size={14} /> Сохранить
            </button>
            {item.videoUrl && (
              <button
                type="button"
                onClick={handleClear}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-lg border border-hot/40 px-3 py-2 text-xs font-semibold text-hot hover:bg-hot/10 disabled:opacity-50"
              >
                <Trash2 size={14} /> Очистить
              </button>
            )}
            <button
              type="button"
              onClick={cancel}
              className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-2 text-xs hover:bg-white/10"
            >
              <X size={14} /> Отмена
            </button>
          </div>

          <p className="text-[11px] opacity-60">
            Поддерживается любой URL: <code>https://youtu.be/...</code>, <code>https://www.youtube.com/watch?v=...</code>, <code>https://rutube.ru/...</code>
          </p>

          {error && (
            <p className="rounded border border-hot/40 bg-hot/10 p-2 text-xs text-hot">{error}</p>
          )}
        </form>
      )}
    </div>
  );
}