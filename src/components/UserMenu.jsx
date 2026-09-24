"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function UserMenu({ username, logoutAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onClickOutside(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/10">
        <span className="font-semibold">{username}</span>
        <span className="text-xs opacity-60">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-white/10 bg-panel p-1 text-sm shadow-lg">
          <Link href={`/u/${username}`} onClick={() => setOpen(false)} className="block rounded px-3 py-2 hover:bg-white/10">Мой профиль</Link>
          <Link href={`/u/${username}#reviews`} onClick={() => setOpen(false)} className="block rounded px-3 py-2 hover:bg-white/10">Отзывы</Link>
          <Link href={`/u/${username}#edit`} onClick={() => setOpen(false)} className="block rounded px-3 py-2 hover:bg-white/10">Настройки профиля</Link>
          <form action={logoutAction}>
            <button className="block w-full rounded px-3 py-2 text-left text-hot hover:bg-white/10">Выйти</button>
          </form>
        </div>
      )}
    </div>
  );
}