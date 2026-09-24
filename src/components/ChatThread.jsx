"use client";
import { useEffect, useRef, useState } from "react";
import { editMessage, deleteMessage } from "@/app/actions";

function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatThread({ meId, initial }) {
  const ref = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [menuId, setMenuId] = useState(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [initial.length]);

  return (
    <div ref={ref} className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 text-sm">
      {initial.map((m) => {
        const mine = m.senderId === meId;
        const isEditing = editingId === m.id;
        return (
          <div key={m.id} className={`group relative flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-lg px-3 py-1.5 ${mine ? "bg-accent text-white" : "bg-slate-200 dark:bg-white/10"}`}>
              {isEditing ? (
                <form
                  action={async (fd) => {
                    fd.set("id", m.id);
                    await editMessage(fd);
                    setEditingId(null);
                  }}
                  className="flex gap-1"
                >
                  <input
                    name="text"
                    defaultValue={m.text}
                    className="input !py-0.5 !text-inherit"
                    autoFocus
                  />
                  <button className="rounded bg-white/20 px-2 text-xs">OK</button>
                  <button type="button" onClick={() => setEditingId(null)} className="rounded bg-white/20 px-2 text-xs">✕</button>
                </form>
              ) : (
                <span>{m.text}</span>
              )}
              <div className={`mt-0.5 flex items-center gap-1 text-[10px] ${mine ? "justify-end text-white/70" : "text-slate-500 dark:text-white/50"}`}>
                {m.editedAt && <span>изм.</span>}
                <span>{formatTime(m.createdAt)}</span>
                {mine && <span title={m.isRead ? "Прочитано" : "Отправлено"}>{m.isRead ? "✓✓" : "✓"}</span>}
              </div>
            </div>
            {mine && !isEditing && (
              <div className="relative ml-1 self-center">
                <button
                  onClick={() => setMenuId(menuId === m.id ? null : m.id)}
                  className="rounded px-1 opacity-0 group-hover:opacity-70 hover:!opacity-100"
                  title="Действия"
                >⋮</button>
                {menuId === m.id && (
                  <div className="absolute right-0 top-full z-10 w-32 rounded-lg border border-white/10 bg-panel p-1 text-left text-xs">
                    <button
                      onClick={() => { setEditingId(m.id); setMenuId(null); }}
                      className="block w-full rounded px-2 py-1 text-left hover:bg-white/10"
                    >Изменить</button>
                    <form action={deleteMessage}>
                      <input type="hidden" name="id" value={m.id} />
                      <button className="block w-full rounded px-2 py-1 text-left text-hot hover:bg-white/10">Удалить</button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}