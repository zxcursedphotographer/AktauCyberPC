"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, X, Check } from "lucide-react";

/**
 * Универсальный dropdown с поиском и группировкой по бренду.
 *
 * В single-режиме value/onChange работают со строкой "Brand Model".
 * В multiple-режиме value/onChange работают с массивом таких строк.
 *
 * Если задан hideBrandChips={true} — чипсы брендов сверху не показываются.
 * Это удобно для фильтра, где нужен просто список доступных моделей.
 */
export default function ComponentPicker({
  presets = {},
  value,
  onChange,
  multiple = false,
  counts = null,
  placeholder = "Выберите...",
  label,
  disabledBrands = [],
  size = "md",
  hideBrandChips = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeBrand, setActiveBrand] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedArr = useMemo(() => {
    if (multiple) return Array.isArray(value) ? value : value ? [value] : [];
    return value ? [value] : [];
  }, [value, multiple]);

  const fullLabel = (brand, model) => `${brand} ${model}`;

  const isSelected = (brand, model) =>
    selectedArr.includes(fullLabel(brand, model));

  const toggleModel = (brand, model) => {
    const full = fullLabel(brand, model);
    if (multiple) {
      const next = selectedArr.includes(full)
        ? selectedArr.filter((m) => m !== full)
        : [...selectedArr, full];
      onChange(next);
    } else {
      onChange(full);
      setOpen(false);
      setQuery("");
    }
  };

  const clearAll = (e) => {
    e.stopPropagation();
    onChange(multiple ? [] : "");
  };

  const visibleBrands = useMemo(() => {
    const q = query.trim().toLowerCase();
    const brands = Object.keys(presets).filter(
      (b) => !disabledBrands.includes(b)
    );

    return brands
      .map((brand) => {
        const models = presets[brand] || [];
        const filteredModels = q
          ? models.filter(
              (m) =>
                m.toLowerCase().includes(q) || brand.toLowerCase().includes(q)
            )
          : models;
        return { brand, models: filteredModels };
      })
      .filter(({ brand, models }) => {
        if (!hideBrandChips && activeBrand && brand !== activeBrand) return false;
        return models.length > 0;
      });
  }, [presets, query, activeBrand, disabledBrands, hideBrandChips]);

  const displayText = useMemo(() => {
    if (multiple) {
      if (selectedArr.length === 0) return placeholder;
      if (selectedArr.length === 1) return selectedArr[0];
      return `Выбрано: ${selectedArr.length}`;
    }
    return selectedArr[0] || placeholder;
  }, [selectedArr, multiple, placeholder]);

  const brandKeys = Object.keys(presets).filter(
    (b) => !disabledBrands.includes(b)
  );

  const wrapperClasses =
    size === "sm" ? "input !py-1.5 text-xs" : "input text-sm";

  return (
    <div className="relative" ref={ref}>
      {label && (
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${wrapperClasses} flex w-full items-center justify-between gap-2 text-left`}
      >
        <span
          className={`truncate ${
            selectedArr.length === 0 ? "text-slate-500" : "text-slate-100"
          }`}
        >
          {displayText}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {selectedArr.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={clearAll}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && clearAll(e)
              }
              className="text-slate-400 hover:text-white"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[280px] max-w-[420px] rounded-xl border border-slate-800 bg-slate-900 p-3 shadow-2xl">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Поиск модели..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {!hideBrandChips && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveBrand(null)}
                className={`rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                  activeBrand === null
                    ? "bg-cyan-400 text-slate-950"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                Все
              </button>
              {brandKeys.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setActiveBrand(b)}
                  className={`rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                    activeBrand === b
                      ? "bg-cyan-400 text-slate-950"
                      : "bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          )}

          <div className="custom-scrollbar max-h-64 space-y-2 overflow-y-auto pr-1">
            {visibleBrands.length === 0 && (
              <p className="py-4 text-center text-xs text-slate-500">
                Ничего не найдено
              </p>
            )}

            {visibleBrands.map(({ brand, models }) => (
              <div key={brand}>
                <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {brand}
                </p>
                <div className="space-y-0.5">
                  {models.map((m) => {
                    const selected = isSelected(brand, m);
                    const count = counts ? counts[`${brand} ${m}`] ?? counts[m] ?? 0 : null;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleModel(brand, m)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                          selected
                            ? "bg-cyan-400 text-slate-950 font-bold"
                            : "text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <span className="truncate">
                          {brand} {m}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {count !== null && (
                            <span
                              className={`text-[11px] ${
                                selected ? "text-slate-800" : "text-slate-500"
                              }`}
                            >
                              ({count})
                            </span>
                          )}
                          {multiple && selected && (
                            <Check size={12} className="text-slate-950" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {multiple && selectedArr.length > 0 && (
            <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2">
              <span className="text-[11px] text-slate-500">
                Выбрано: {selectedArr.length}
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[11px] text-hot hover:underline"
              >
                Сбросить
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}