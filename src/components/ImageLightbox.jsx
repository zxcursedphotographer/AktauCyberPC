"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageLightbox({ images, index, onClose, onIndexChange }) {
  const total = images.length;
  const current = images[index];

  const prev = useCallback(() => {
    if (total < 2) return;
    onIndexChange((index - 1 + total) % total);
  }, [index, total, onIndexChange]);

  const next = useCallback(() => {
    if (total < 2) return;
    onIndexChange((index + 1) % total);
  }, [index, total, onIndexChange]);

  // Esc + стрелки
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  // Блокировка скролла body
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Свайпы на тач-устройствах
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    function onStart(e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }
    function onEnd(e) {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) next();
        else prev();
      }
    }
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [prev, next]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Кнопка закрыть */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
        aria-label="Закрыть"
      >
        <X size={22} />
      </button>

      {/* Стрелка влево */}
      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 sm:left-4"
          aria-label="Предыдущее"
        >
          <ChevronLeft size={26} />
        </button>
      )}

      {/* Стрелка вправо */}
      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 sm:right-4"
          aria-label="Следующее"
        >
          <ChevronRight size={26} />
        </button>
      )}

      {/* Картинка */}
      <img
        src={current}
        alt=""
        className="max-h-[92vh] max-w-[92vw] select-none object-contain"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* Счётчик */}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur-md">
          {index + 1} / {total}
        </div>
      )}
    </div>
  );
}