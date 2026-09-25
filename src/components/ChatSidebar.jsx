"use client";

import { useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import { isOnline } from "@/lib/presence";

function formatTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const min = Math.floor(diff / 60000);
  const hour = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин`;
  if (hour < 24) return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  if (day < 7) return d.toLocaleDateString("ru", { weekday: "short" });
  return d.toLocaleDateString("ru", { day: "2-digit", month: "2-digit" });
}

export default function ChatSidebar({ conversations, tab, selLId, selUId, emptyText }) {
  const [q, setQ] = useState("");

  const filtered = conversations.filter((c) => {
    if (!q.trim()) return true;
    const query = q.toLowerCase();
    return (
      c.other.username.toLowerCase().includes(query) ||
      c.listing.title.toLowerCase().includes(query) ||
      (c.last.text || "").toLowerCase().includes(query)
    );
  });

  const tabCls = (t) =>
    `flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium transition ${
      tab === t
        ? "bg-accent text-white shadow-lg shadow-accent/30"
        : "bg-white/5 hover:bg-white/10"
    }`;

  return (
    <aside className="card flex min-h-0 flex-col space-y-2 md:overflow-hidden">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Поиск по диалогам и товарам…"
        className="input text-sm"
      />

      <div className="flex gap-2">
        <Link href="/chat?tab=buy" className={tabCls("buy")}>Покупаю</Link>
        <Link href="/chat?tab=sell" className={tabCls("sell")}>Продаю</Link>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <p className="px-2 py-4 text-sm opacity-70">{q ? "Ничего не найдено." : emptyText}</p>
        )}
        {filtered.map((c) => {
          const active = c.listing.id === selLId && c.other.id === selUId;
          const online = isOnline(c.other.lastSeen);
          return (
            <Link
              key={c.k}
              href={`/chat?tab=${tab}&l=${c.listing.id}&u=${c.other.id}`}
              className={`block rounded-lg p-2 text-sm transition ${
                active ? "bg-white/10 ring-1 ring-accent/40" : "hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="relative shrink-0">
                  <Avatar user={c.other} size={36} />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-panel ${
                      online ? "bg-emerald-500" : "bg-slate-500"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <b className="truncate">{c.other.username}</b>
                    <span className="shrink-0 text-xs opacity-60">{formatTime(c.last.createdAt)}</span>
                  </div>
                  <div className="truncate text-xs opacity-70">{c.listing.title}</div>
                </div>
                {c.unread > 0 && (
                  <span className="shrink-0 rounded-full bg-hot px-1.5 text-xs font-bold text-white">
                    {c.unread}
                  </span>
                )}
              </div>
              <div className="mt-1 truncate pl-11 text-xs opacity-60">{c.last.text}</div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}