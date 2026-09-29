"use client";

import { useEffect } from "react";
import { registerView } from "@/app/actions";

// Считает просмотр один раз за сессию браузера (раньше +1 набегало
// при каждом автообновлении страницы каждые 15 секунд).
export default function ViewCounter({ id }) {
  useEffect(() => {
    try {
      const k = `viewed:${id}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    } catch {}
    registerView(id).catch(() => {});
  }, [id]);
  return null;
}
