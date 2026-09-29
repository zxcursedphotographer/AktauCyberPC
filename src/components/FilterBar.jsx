"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CATS,
  CITIES,
  GPU_PRESETS,
  CPU_PRESETS,
  COMPONENT_LABELS,
} from "@/lib/constants";
import { Search, Filter, X } from "lucide-react";
import ComponentPicker from "@/components/ComponentPicker";

// Строим пресеты вида { brand: [models] } из плоского списка "Brand Model"
function buildPresetsFromFlat(flatList) {
  const result = {};
  for (const full of flatList) {
    const sp = full.indexOf(" ");
    if (sp === -1) continue;
    const brand = full.slice(0, sp);
    const model = full.slice(sp + 1);
    if (!result[brand]) result[brand] = [];
    result[brand].push(model);
  }
  return result;
}

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("cat") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");

  // Выбранные модели (полные строки "NVIDIA RTX 3070")
  const [gpuModels, setGpuModels] = useState(
    () => (searchParams.get("gpu_models") || "").split(",").filter(Boolean)
  );
  const [cpuModels, setCpuModels] = useState(
    () => (searchParams.get("cpu_models") || "").split(",").filter(Boolean)
  );

  // Для готовых ПК: выбранные компоненты (полные строки "NVIDIA RTX 3070")
  const [pcGpu, setPcGpu] = useState(
    () => (searchParams.get("pc_gpu_models") || "").split(",").filter(Boolean)
  );
  const [pcCpu, setPcCpu] = useState(
    () => (searchParams.get("pc_cpu_models") || "").split(",").filter(Boolean)
  );

  // Counts и пресеты из доступных объявлений
  const [gpuAvailable, setGpuAvailable] = useState(null); // [{full, count}]
  const [cpuAvailable, setCpuAvailable] = useState(null);
  const [pcGpuAvailable, setPcGpuAvailable] = useState(null);
  const [pcCpuAvailable, setPcCpuAvailable] = useState(null);

  const isGpuCategory = category === "Видеокарты";
  const isCpuCategory = category === "Процессоры";
  const isPcCategory = category === "Готовые ПК";

  // Загружаем доступные модели
  useEffect(() => {
    let cancelled = false;

    async function load() {
      // GPU/CPU категории — по modelPreset
      if (isGpuCategory) {
        try {
          const res = await fetch(
            `/api/preset-counts?category=${encodeURIComponent("Видеокарты")}&city=${encodeURIComponent(city || "")}`
          );
          const data = await res.json();
          if (!cancelled) setGpuAvailable(data.counts || {});
        } catch {
          if (!cancelled) setGpuAvailable({});
        }
      }

      if (isCpuCategory) {
        try {
          const res = await fetch(
            `/api/preset-counts?category=${encodeURIComponent("Процессоры")}&city=${encodeURIComponent(city || "")}`
          );
          const data = await res.json();
          if (!cancelled) setCpuAvailable(data.counts || {});
        } catch {
          if (!cancelled) setCpuAvailable({});
        }
      }

      // Готовые ПК — по компонентам
      if (isPcCategory) {
        try {
          const [gpuRes, cpuRes] = await Promise.all([
            fetch(
              `/api/preset-counts?componentType=GPU&city=${encodeURIComponent(city || "")}`
            ),
            fetch(
              `/api/preset-counts?componentType=CPU&city=${encodeURIComponent(city || "")}`
            ),
          ]);
          const gpuData = await gpuRes.json();
          const cpuData = await cpuRes.json();
          if (!cancelled) {
            setPcGpuAvailable(gpuData.counts || {});
            setPcCpuAvailable(cpuData.counts || {});
          }
        } catch {
          if (!cancelled) {
            setPcGpuAvailable({});
            setPcCpuAvailable({});
          }
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [category, city, isGpuCategory, isCpuCategory, isPcCategory]);

  // Пресеты { brand: [models] } только из доступных
  const gpuPresetsAvailable = gpuAvailable
    ? buildPresetsFromFlat(Object.keys(gpuAvailable))
    : {};
  const cpuPresetsAvailable = cpuAvailable
    ? buildPresetsFromFlat(Object.keys(cpuAvailable))
    : {};
  const pcGpuPresetsAvailable = pcGpuAvailable
    ? buildPresetsFromFlat(Object.keys(pcGpuAvailable))
    : {};
  const pcCpuPresetsAvailable = pcCpuAvailable
    ? buildPresetsFromFlat(Object.keys(pcCpuAvailable))
    : {};

  const handleCategoryChange = (e) => {
    const nextCat = e.target.value;
    setCategory(nextCat);
    setGpuModels([]);
    setCpuModels([]);
    setPcGpu([]);
    setPcCpu([]);
  };

  const applyFilters = (override = {}) => {
    const params = new URLSearchParams();

    const q = override.q !== undefined ? override.q : search;
    const cat = override.cat !== undefined ? override.cat : category;
    const c = override.city !== undefined ? override.city : city;
    const g = override.gpuModels !== undefined ? override.gpuModels : gpuModels;
    const p = override.cpuModels !== undefined ? override.cpuModels : cpuModels;
    const pg = override.pcGpu !== undefined ? override.pcGpu : pcGpu;
    const pc = override.pcCpu !== undefined ? override.pcCpu : pcCpu;

    if (q) params.set("q", q);
    if (cat) params.set("cat", cat);
    if (c) params.set("city", c);

    if (cat === "Видеокарты" && g.length > 0) {
      params.set("gpu_models", g.join(","));
    }
    if (cat === "Процессоры" && p.length > 0) {
      params.set("cpu_models", p.join(","));
    }
    if (cat === "Готовые ПК") {
      if (pg.length > 0) params.set("pc_gpu_models", pg.join(","));
      if (pc.length > 0) params.set("pc_cpu_models", pc.join(","));
    }

    router.push(`/?${params.toString()}`);
  };

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setCity("");
    setGpuModels([]);
    setCpuModels([]);
    setPcGpu([]);
    setPcCpu([]);
    router.push("/");
  };

  const hasAnyFilter =
    search ||
    category ||
    city ||
    gpuModels.length > 0 ||
    cpuModels.length > 0 ||
    pcGpu.length > 0 ||
    pcCpu.length > 0;

  return (
    <div className="card space-y-4 p-4">
      {/* Верхняя строка: поиск + город + кнопка */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск комплектующих..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="input pl-10 text-sm"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                applyFilters({ q: "" });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <select
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            applyFilters({ city: e.target.value });
          }}
          className="input text-sm sm:w-44"
        >
          <option value="">Все города</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button
          onClick={() => applyFilters()}
          className="btn flex items-center justify-center gap-2 font-semibold"
        >
          <Filter size={16} />
          Найти
        </button>
      </div>

      {/* Категория */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-semibold text-slate-400">Категория:</span>
        <select
          value={category}
          onChange={handleCategoryChange}
          className="input !py-1.5 text-xs font-medium sm:w-52"
        >
          <option value="">Все категории</option>
          {CATS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {hasAnyFilter && (
          <button
            onClick={resetFilters}
            className="ml-auto text-xs font-medium text-hot hover:underline"
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      {/* Фильтр «Видеокарты» */}
      {isGpuCategory && (
        <div className="space-y-2 border-t border-white/10 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
            Доступные видеокарты
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[260px] flex-1">
              <ComponentPicker
                presets={gpuPresetsAvailable}
                counts={gpuAvailable}
                value={gpuModels}
                onChange={setGpuModels}
                multiple
                size="sm"
                placeholder="Выберите видеокарты..."
                hideBrandChips
              />
            </div>
            <button
              type="button"
              onClick={() => applyFilters()}
              className="btn !py-1.5 text-xs font-semibold"
            >
              Применить
            </button>
          </div>
          {gpuPresetsAvailable &&
            Object.keys(gpuPresetsAvailable).length === 0 && (
              <p className="text-xs text-slate-500">
                Нет доступных видеокарт в объявлениях.
              </p>
            )}
        </div>
      )}

      {/* Фильтр «Процессоры» */}
      {isCpuCategory && (
        <div className="space-y-2 border-t border-white/10 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
            Доступные процессоры
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[260px] flex-1">
              <ComponentPicker
                presets={cpuPresetsAvailable}
                counts={cpuAvailable}
                value={cpuModels}
                onChange={setCpuModels}
                multiple
                size="sm"
                placeholder="Выберите процессоры..."
                hideBrandChips
              />
            </div>
            <button
              type="button"
              onClick={() => applyFilters()}
              className="btn !py-1.5 text-xs font-semibold"
            >
              Применить
            </button>
          </div>
          {cpuPresetsAvailable &&
            Object.keys(cpuPresetsAvailable).length === 0 && (
              <p className="text-xs text-slate-500">
                Нет доступных процессоров в объявлениях.
              </p>
            )}
        </div>
      )}

      {/* Фильтр «Готовые ПК» — только GPU + CPU */}
      {isPcCategory && (
        <div className="space-y-3 border-t border-white/10 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
            Доступные комплектующие в сборках
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* GPU */}
            <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-semibold text-slate-200">
                {COMPONENT_LABELS.GPU}
              </p>
              <ComponentPicker
                presets={pcGpuPresetsAvailable}
                counts={pcGpuAvailable}
                value={pcGpu}
                onChange={setPcGpu}
                multiple
                size="sm"
                placeholder="Выберите видеокарты..."
                hideBrandChips
              />
            </div>

            {/* CPU */}
            <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-semibold text-slate-200">
                {COMPONENT_LABELS.CPU}
              </p>
              <ComponentPicker
                presets={pcCpuPresetsAvailable}
                counts={pcCpuAvailable}
                value={pcCpu}
                onChange={setPcCpu}
                multiple
                size="sm"
                placeholder="Выберите процессоры..."
                hideBrandChips
              />
            </div>
          </div>

          <button
            onClick={() => applyFilters()}
            className="btn w-full font-semibold sm:w-auto"
          >
            Применить фильтры сборки
          </button>
        </div>
      )}
    </div>
  );
}