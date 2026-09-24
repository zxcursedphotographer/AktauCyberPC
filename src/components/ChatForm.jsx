"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage, sendSupport } from "@/app/actions";

export default function ChatForm({ listingId, receiverId, mode = "listing" }) {
  const ref = useRef(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData) {
    if (mode === "support") {
      await sendSupport(formData);
    } else {
      await sendMessage(formData);
    }
    ref.current?.reset();
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form ref={ref} action={handleSubmit} className="mt-3 flex gap-2">
      {mode !== "support" && <input type="hidden" name="listingId" value={listingId || ""} />}
      <input type="hidden" name="receiverId" value={receiverId} />
      <input
        name="text"
        required
        maxLength={2000}
        placeholder="Сообщение…"
        className="input"
        autoComplete="off"
        disabled={pending}
      />
      <button className="btn" disabled={pending}>
        {pending ? "Отправка…" : "Отправить"}
      </button>
    </form>
  );
}