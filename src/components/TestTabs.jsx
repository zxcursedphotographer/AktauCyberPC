"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import ImageLightbox from "@/components/ImageLightbox";

const LABEL = { GPU: "Видеокарта", CPU: "Процессор", RAM: "Память", STORAGE: "Накопитель", MOTHERBOARD: "Материнская плата" };
const HINT = { GPU: "FurMark / Superposition", CPU: "AIDA64 / OCCT", RAM: "TestMem5 / OCCT", STORAGE: "CrystalDiskInfo (S.M.A.R.T.)", MOTHERBOARD: "AIDA64" };

export default function TestTabs({ tests }) {
  const types = [...new Set(tests.map((t) => t.componentType))];
  const [tab, setTab] = useState(types[0]);
  const [lightbox, setLightbox] = useState(null);

  if (!types.length) {
    return (
      <section className="card">
        <p className="text-sm text-slate-400">
          Продавец пока не добавил тесты комплектующих.
        </p>
      </section>
    );
  }

  return (
    <section className="card">
      {/* Табы */}
      <div role="tablist" className="mb-4 flex flex-wrap gap-2">
        {types.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === t ? "bg-accent font-bold text-slate-950" : "bg-white/5 hover:bg-white/10"
            }`}
          >
            {LABEL[t]}
          </button>
        ))}
      </div>

      {/* Тесты для выбранного компонента */}
      {tests
        .filter((t) => t.componentType === tab)
        .map((t) => (
          <div key={t.id} className="mb-4 last:mb-0">
            <div className="flex flex-wrap items-center gap-2 font-semibold">
              {t.resultStatus === "PASSED" ? (
                <CheckCircle2 className="text-emerald-500" size={18} />
              ) : (
                <XCircle className="text-hot" size={18} />
              )}
              <span>{t.testTitle}</span>
              <span className="text-xs font-normal opacity-60">({HINT[t.componentType]})</span>
            </div>

            {/* Метрики (не массивы) */}
            <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              {Object.entries(t.metrics)
                .filter(([, v]) => !Array.isArray(v))
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-white/5 py-1">
                    <dt className="opacity-70">{k}</dt>
                    <dd className="font-medium">{String(v)}</dd>
                  </div>
                ))}
            </dl>

            {/* Метрики (массивы — графики температур) */}
            {Object.entries(t.metrics)
              .filter(([, v]) => Array.isArray(v))
              .map(([k, v]) => (
                <div key={k} className="mt-4">
                  <p className="mb-1 text-xs opacity-60">Температура во времени, °C</p>
                  <div className="flex h-24 items-end gap-1">
                    {v.map((n, i) => (
                      <div
                        key={i}
                        title={`${n}°C`}
                        style={{ height: `${Math.min(100, n)}%` }}
                        className={`flex-1 rounded-t ${n > 80 ? "bg-hot" : "bg-accent"}`}
                      />
                    ))}
                  </div>
                </div>
              ))}

            {/* Скриншоты */}
            {t.mediaUrls.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {t.mediaUrls.map((u, i) => (
                  <button
                    key={u + i}
                    type="button"
                    onClick={() => setLightbox({ images: t.mediaUrls, index: i })}
                    className="group relative overflow-hidden rounded-lg border border-white/10 transition hover:border-accent"
                  >
                    <img
                      src={u}
                      alt="Скриншот теста"
                      className="h-24 w-auto cursor-zoom-in object-cover transition group-hover:opacity-90"
                    />
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-xs text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                      Открыть
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(newIndex) => setLightbox((prev) => ({ ...prev, index: newIndex }))}
        />
      )}
    </section>
  );
}