"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { sendToReview, closeReview, setAccountStatus, adjustTrust } from "@/app/actions";

export default function AdminActionsMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-white/20 px-2 py-1 text-sm hover:bg-white/10"
        title="Действия"
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-white/10 bg-panel p-1 text-left text-sm shadow-lg">
          <Link
            href={`/u/${user.username}#reviews`}
            onClick={() => setOpen(false)}
            className="block rounded px-3 py-2 hover:bg-white/10"
          >
            Профиль и отзывы
          </Link>

          <form action={sendToReview}>
            <input type="hidden" name="id" value={user.id} />
            <button className="block w-full rounded px-3 py-2 text-left hover:bg-white/10">
              Отправить на проверку
            </button>
          </form>

          {user.status === "UNDER_REVIEW" && (
            <form action={closeReview}>
              <input type="hidden" name="id" value={user.id} />
              <button className="block w-full rounded px-3 py-2 text-left text-emerald-400 hover:bg-emerald-500/10">
                Снять с проверки
              </button>
            </form>
          )}

          <div className="my-1 border-t border-white/10" />

          <form action={adjustTrust}>
            <input type="hidden" name="id" value={user.id} />
            <input type="hidden" name="delta" value="5" />
            <button className="block w-full rounded px-3 py-2 text-left text-emerald-400 hover:bg-emerald-500/10">
              Похвала +5 траст
            </button>
          </form>

          <form action={adjustTrust}>
            <input type="hidden" name="id" value={user.id} />
            <input type="hidden" name="delta" value="-5" />
            <button className="block w-full rounded px-3 py-2 text-left text-hot hover:bg-hot/10">
              Выговор −5 траст
            </button>
          </form>

          <div className="my-1 border-t border-white/10" />

          {user.status === "BANNED" ? (
            <form action={setAccountStatus}>
              <input type="hidden" name="id" value={user.id} />
              <button name="status" value="ACTIVE" className="block w-full rounded px-3 py-2 text-left text-emerald-400 hover:bg-emerald-500/10">
                Разблокировать
              </button>
            </form>
          ) : (
            <form action={setAccountStatus}>
              <input type="hidden" name="id" value={user.id} />
              <button name="status" value="BANNED" className="block w-full rounded px-3 py-2 text-left text-hot hover:bg-hot/10">
                Заблокировать
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}