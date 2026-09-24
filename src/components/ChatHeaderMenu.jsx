"use client";
import { useState } from "react";
import { deleteChat, blockUser, unblockUser } from "@/app/actions";

export default function ChatHeaderMenu({ listingId, otherId, blockedByMe = false }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative ml-auto">
      <button onClick={() => setOpen(!open)} className="rounded-lg px-2 py-1 hover:bg-white/10" title="Действия">⋮</button>
      {open && (
        <div className="absolute right-0 top-full z-10 w-64 rounded-lg border border-white/10 bg-panel p-1 text-sm">
          <form action={deleteChat}>
            <input type="hidden" name="listingId" value={listingId || ""} />
            <input type="hidden" name="otherId" value={otherId} />
            <button className="block w-full rounded px-3 py-2 text-left hover:bg-white/10">
              Удалить переписку (только у меня)
            </button>
          </form>
          {blockedByMe ? (
            <form action={unblockUser}>
              <input type="hidden" name="userId" value={otherId} />
              <button className="block w-full rounded px-3 py-2 text-left hover:bg-white/10">
                Разблокировать пользователя
              </button>
            </form>
          ) : (
            <form action={blockUser}>
              <input type="hidden" name="userId" value={otherId} />
              <button className="block w-full rounded px-3 py-2 text-left text-hot hover:bg-white/10">
                Заблокировать пользователя
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}