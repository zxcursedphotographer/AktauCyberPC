"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";

export default function UserMenu({ username, avatarUrl, logoutAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-full border px-2 py-1 transition ${
          open
            ? "border-accent/60 bg-accent/10"
            : "border-white/15 hover:border-accent/40 hover:bg-white/10"
        }`}
      >
        <Avatar user={{ username, avatarUrl }} size={26} />
        <span className="hidden max-w-[120px] truncate text-sm font-semibold sm:inline">
          {username}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={`shrink-0 opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-2xl border border-white/10 bg-panel/95 p-1.5 text-sm shadow-xl backdrop-blur-xl">
          <div className="px-3 py-2">
            <div className="text-xs opacity-60">Вы вошли как</div>
            <div className="truncate font-semibold">{username}</div>
          </div>
          <div className="my-1 h-px bg-white/10" />

          <Link
            href={`/u/${username}`}
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 transition hover:bg-white/10"
          >
            Мой профиль
          </Link>
          <Link
            href={`/u/${username}?tab=review`}
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 transition hover:bg-white/10"
          >
            Мои объявления
          </Link>
          <Link
            href={`/u/${username}#reviews`}
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 transition hover:bg-white/10"
          >
            Отзывы
          </Link>
          <Link
            href={`/u/${username}#edit`}
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 transition hover:bg-white/10"
          >
            Настройки профиля
          </Link>

          <div className="my-1 h-px bg-white/10" />

          <form action={logoutAction}>
            <button className="block w-full rounded-lg px-3 py-2 text-left text-hot transition hover:bg-hot/10">
              Выйти
            </button>
          </form>
        </div>
      )}
    </div>
  );
}