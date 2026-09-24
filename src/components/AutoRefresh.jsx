"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
// Живое обновление: раз в 4 секунды, пока вкладка открыта
export default function AutoRefresh({ every = 4000 }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) router.refresh(); }, every);
    return () => clearInterval(t);
  }, [router, every]);
  return null;
}
