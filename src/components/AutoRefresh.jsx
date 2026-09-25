"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh({ every = 15000 }) {
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => {
      if (document.hidden) return;
      // Не обновляем если пользователь печатает в поле ввода
      const el = document.activeElement;
      const isTyping = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
      if (isTyping) return;
      router.refresh();
    }, every);
    return () => clearInterval(t);
  }, [router, every]);

  return null;
}