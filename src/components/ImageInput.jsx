"use client";

import { useState, useRef, useEffect } from "react";

async function compressImage(file, maxPx = 1600) {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, maxPx / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);

    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.82));
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    return file;
  }
}

export default function ImageInput({
  name = "photos",
  maxFiles = 6,
  max = 1600,
  className = "",
  single = false,
}) {
  const limit = single ? 1 : maxFiles;
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  // Создаём preview-URL и освобождаем память при размонтировании
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const syncInput = (newFiles) => {
    if (!fileInputRef.current) return;
    const dt = new DataTransfer();
    newFiles.forEach((file) => dt.items.add(file));
    fileInputRef.current.files = dt.files;
  };

  const handleSelect = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    setLoading(true);

    const compressed = await Promise.all(selected.map((file) => compressImage(file, max)));

    const updated = [...files, ...compressed].slice(0, limit);
    setFiles(updated);
    syncInput(updated);

    setLoading(false);
  };

  const handleRemove = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    syncInput(updated);
  };

  return (
    <div className={`space-y-2 text-left ${className}`} onClick={(e) => e.stopPropagation()}>
      <input
        type="file"
        name={name}
        ref={fileInputRef}
        onChange={handleSelect}
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={!single}
        className="hidden"
      />

      <div className="flex flex-wrap items-center gap-2">
        {previews.map((url, index) => (
          <div
            key={url}
            className={`relative shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/20 ${
              single ? "h-20 w-20" : "h-14 w-14"
            }`}
          >
            <img src={url} alt="preview" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(index);
              }}
              className="absolute right-0.5 top-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white hover:bg-rose-500"
            >
              ✕
            </button>
          </div>
        ))}

        {files.length < limit && (
          <button
            type="button"
            disabled={loading}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className={`flex shrink-0 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-black/20 text-slate-400 transition hover:border-accent hover:text-accent ${
              single ? "h-20 w-20" : "h-14 w-14"
            }`}
          >
            {loading ? (
              <span className="animate-pulse text-[9px] text-accent">...</span>
            ) : (
              <>
                <span className="text-base font-bold leading-none">+</span>
                <span className="mt-0.5 text-[9px] font-medium">Фото</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="text-[11px] text-slate-400">
        Загружено: <span className="font-medium text-white">{files.length}</span> из {limit}
      </div>
    </div>
  );
}