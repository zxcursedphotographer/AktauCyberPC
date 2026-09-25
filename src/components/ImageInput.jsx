"use client";

import { useState, useRef } from "react";

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
  const fileInputRef = useRef(null);

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

    const compressed = await Promise.all(
      selected.map((file) => compressImage(file, max))
    );

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
    <div
      className={`space-y-2 text-left ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="file"
        name={name}
        ref={fileInputRef}
        onChange={handleSelect}
        accept="image/*"
        multiple={!single}
        className="hidden"
      />

      <div className="flex flex-wrap gap-2 items-center">
        {files.map((file, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shrink-0 ${
              single ? "h-20 w-20" : "h-14 w-14"
            }`}
          >
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(index);
              }}
              className="absolute top-0.5 right-0.5 bg-rose-600 hover:bg-rose-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold z-10 cursor-pointer"
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
            className={`rounded-lg border-2 border-dashed border-slate-700 hover:border-cyan-500 bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-cyan-400 flex flex-col items-center justify-center transition-all shrink-0 cursor-pointer ${
              single ? "h-20 w-20" : "h-14 w-14"
            }`}
          >
            {loading ? (
              <span className="text-[9px] text-cyan-400 animate-pulse">...</span>
            ) : (
              <>
                <span className="text-base font-bold leading-none">+</span>
                <span className="text-[9px] font-medium mt-0.5">Фото</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="text-[11px] text-slate-400">
        Загружено: <span className="text-white font-medium">{files.length}</span> из {limit}
      </div>
    </div>
  );
}