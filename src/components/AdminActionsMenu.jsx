"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendToReview, closeReview, setAccountStatus, adjustTrust } from "@/app/actions";

export default function AdminActionsMenu({ user }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const closeAndRefresh = () => {
    setOpen(false);
    startTransition(() => router.refresh());
  };

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-white/20 px-2.5 py-1.5 text-sm hover:bg-white/10"
        title="Действия"
      >
        ⋯
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-60 rounded-lg border border-white/10 bg-panel p-1 text-left text-sm shadow-lg">
          <Link
            href={`/u/${user.username}#reviews`}
            className="block rounded px-3 py-2 hover:bg-white/10"
          >
            📋 Профиль и отзывы
          </Link>

          <form
            action={async (fd) => {
              await sendToReview(fd);
              closeAndRefresh();
            }}
          >
            <input type="hidden" name="id" value={user.id} />
            <button
              disabled={pending}
              className="block w-full rounded px-3 py-2 text-left hover:bg-white/10 disabled:opacity-50"
            >
              🔍 Отправить на проверку
            </button>
          </form>

          {user.status === "UNDER_REVIEW" && (
            <form
              action={async (fd) => {
                await closeReview(fd);
                closeAndRefresh();
              }}
            >
              <input type="hidden" name="id" value={user.id} />
              <button
                disabled={pending}
                className="block w-full rounded px-3 py-2 text-left text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
              >
                ✅ Снять с проверки
              </button>
            </form>
          )}

          <div className="my-1 border-t border-white/10" />

          <form
            action={async (fd) => {
              await adjustTrust(fd);
              closeAndRefresh();
            }}
          >
            <input type="hidden" name="id" value={user.id} />
            <input type="hidden" name="delta" value="5" />
            <button
              disabled={pending}
              className="block w-full rounded px-3 py-2 text-left text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
            >
              👍 Похвала +5 траст
            </button>
          </form>

          <form
            action={async (fd) => {
              await adjustTrust(fd);
              closeAndRefresh();
            }}
          >
            <input type="hidden" name="id" value={user.id} />
            <input type="hidden" name="delta" value="-5" />
            <button
              disabled={pending}
              className="block w-full rounded px-3 py-2 text-left text-hot hover:bg-hot/10 disabled:opacity-50"
            >
              👎 Выговор −5 траст
            </button>
          </form>

          <div className="my-1 border-t border-white/10" />

          <form
            action={async (fd) => {
              await setAccountStatus(fd);
              closeAndRefresh();
            }}
          >
            <input type="hidden" name="id" value={user.id} />
            {user.status === "BANNED" ? (
              <button
                name="status"
                value="ACTIVE"
                disabled={pending}
                className="block w-full rounded px-3 py-2 text-left text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
              >
                🔓 Разблокировать
              </button>
            ) : (
              <button
                name="status"
                value="BANNED"
                disabled={pending}
                className="block w-full rounded px-3 py-2 text-left text-hot hover:bg-hot/10 disabled:opacity-50"
              >
                🔒 Заблокировать
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}