"use client";

import { useEffect } from "react";
import Link from "next/link";

// Любая непойманная ошибка страницы или действия показывается здесь,
// а не белым экраном «Application error».
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card mx-auto my-16 max-w-md space-y-3 text-center">
      <div className="text-4xl">⚠️</div>
      <h1 className="text-xl font-bold">Что-то пошло не так</h1>
      <p className="text-sm opacity-70">
        Действие не выполнено. Попробуйте ещё раз — если ошибка повторяется, напишите в поддержку.
      </p>
      <div className="flex gap-2">
        <button onClick={() => reset()} className="btn flex-1 justify-center">Повторить</button>
        <Link href="/" className="flex-1 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
          На главную
        </Link>
      </div>
    </div>
  );
}
