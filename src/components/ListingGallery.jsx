"use client";

import { useState } from "react";
import ImageLightbox from "@/components/ImageLightbox";

export default function ListingGallery({ images = [], title = "", dimmed = false }) {
  const [lightbox, setLightbox] = useState(null);

  if (!images.length) {
    return (
      <div className="card !p-2 overflow-hidden">
        <div className="relative flex aspect-[16/10] w-full items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900">
          <span className="text-sm text-slate-400">Нет фотографий</span>
        </div>
      </div>
    );
  }

  const main = images[0];

  return (
    <div className="card !p-2 overflow-hidden space-y-2">
      {/* Большое фото */}
      <button
        type="button"
        onClick={() => setLightbox({ images, index: 0 })}
        className="group relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-900"
      >
        <img
          src={main}
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-xl"
        />
        <img
          src={main}
          alt={title}
          className={`relative max-h-full max-w-full cursor-zoom-in object-contain transition group-hover:scale-[1.01] ${dimmed ? "opacity-70" : ""}`}
        />
      </button>

      {/* Миниатюры */}
      {images.length > 1 && (
        <div className="flex snap-x gap-2 overflow-x-auto pb-1 pt-1">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setLightbox({ images, index: i })}
              className="relative aspect-square h-20 shrink-0 snap-start overflow-hidden rounded-md border border-slate-200 bg-slate-900 transition hover:border-accent dark:border-white/10"
            >
              <img src={url} alt="" className="h-full w-full cursor-zoom-in object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(newIndex) => setLightbox((prev) => ({ ...prev, index: newIndex }))}
        />
      )}
    </div>
  );
}