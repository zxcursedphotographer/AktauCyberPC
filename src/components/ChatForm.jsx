"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/app/actions";

export default function ChatForm({ listingId, receiverId }) {
  const ref = useRef(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData) {
    await sendMessage(formData);
    ref.current?.reset();
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form ref={ref} action={handleSubmit} className="mt-3 flex gap-2">
      <input type="hidden" name="listingId" value={listingId} />
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