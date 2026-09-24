"use client";
import { useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import { deleteChat, blockUser, unblockUser } from "@/app/actions";
import { presenceText, isOnline } from "@/lib/presence";

export default function ChatHeader({ other, listing, blockedByMe, titleOverride }) {
  const [open, setOpen] = useState(false);
  const online = isOnline(other.lastSeen);

  return (
    <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
      <div className="relative shrink-0">
        <Avatar user={other} size={36} />
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-panel ${
            online ? "bg-emerald-500" : "bg-slate-500"
          }`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <b className="block truncate">{titleOverride || other.username}</b>
        <span className={`text-xs ${online ? "text-emerald-400" : "opacity-60"}`}>
          {presenceText(other.lastSeen)}
        </span>
        {listing && (
          <>
            <span className="mx-1 text-xs opacity-40">·</span>
            <Link href={`/listing/${listing.id}`} className="text-xs underline opacity-70 hover:opacity-100">
              {listing.title}
            </Link>
          </>
        )}
      </div>

      <Link href={`/u/${other.username}`} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10">
        Профиль
      </Link>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg px-2 py-1 hover:bg-white/10"
          title="Действия"
        >
          ⋮
        </button>
        {open && (
          <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-lg border border-white/10 bg-panel p-1 text-sm shadow-lg">
            <form action={deleteChat}>
              <input type="hidden" name="listingId" value={listing?.id || ""} />
              <input type="hidden" name="otherId" value={other.id} />
              <button className="block w-full rounded px-3 py-2 text-left hover:bg-white/10">
                Удалить переписку (только у меня)
              </button>
            </form>

            {blockedByMe ? (
              <form action={unblockUser}>
                <input type="hidden" name="userId" value={other.id} />
                <button className="block w-full rounded px-3 py-2 text-left hover:bg-white/10">
                  Разблокировать
                </button>
              </form>
            ) : (
              <form action={blockUser}>
                <input type="hidden" name="userId" value={other.id} />
                <button className="block w-full rounded px-3 py-2 text-left text-hot hover:bg-white/10">
                  Заблокировать
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}