"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage, sendSupport } from "@/app/actions";

export default function ChatForm({ listingId, receiverId, mode = "listing" }) {
  const ref = useRef(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData) {
    setError("");
    if (mode !== "support" && !listingId) {
      setError("Не удалось определить объявление");
      return;
    }
    setSending(true);
    try {
      const res = mode === "support" ? await sendSupport(formData) : await sendMessage(formData);
      if (res?.error) {
        setError(res.error); // текст остаётся в поле — ничего не теряем
        return;
      }
      ref.current?.reset();
      startTransition(() => router.refresh());
    } catch {
      setError("Не удалось отправить. Проверьте соединение и попробуйте ещё раз");
    } finally {
      setSending(false);
    }
  }

  const busy = pending || sending;

  return (
    <div className="mt-3">
      {error && (
        <p role="alert" className="mb-2 rounded-lg border border-hot/40 bg-hot/10 px-3 py-1.5 text-xs text-hot">
          {error}
        </p>
      )}
      <form ref={ref} action={handleSubmit} className="flex gap-2">
        {mode !== "support" && <input type="hidden" name="listingId" value={listingId || ""} />}
        <input type="hidden" name="receiverId" value={receiverId} />
        <input
          name="text"
          required
          maxLength={2000}
          placeholder="Сообщение…"
          className="input text-sm"
          autoComplete="off"
          disabled={busy}
        />
        <button className="btn text-sm" disabled={busy}>
          {busy ? "…" : "Отправить"}
        </button>
      </form>
    </div>
  );
}
