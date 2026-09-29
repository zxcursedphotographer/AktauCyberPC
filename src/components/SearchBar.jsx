"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MapPin,
  SlidersHorizontal,
  ChevronDown,
  Plus,
  X,
  Check,
} from "lucide-react";
import {
  CATS,
  GPU_PRESETS,
  CPU_PRESETS,
  findBrandByModel,
} from "@/lib/constants";
import ComponentPicker from "@/components/ComponentPicker";

const KAZAKHSTAN_CITIES = [
  "Весь Казахстан",
  "Актау",
  "Алматы",
  "Астана",
  "Шымкент",
  "Караганда",
  "Актобе",
  "Атырау",
  "Павлодар",
  "Тараз",
  "Усть-Каменогорск",
  "Семей",
  "Кызылорда",
  "Костанай",
  "Уральск",
  "Петропавловск",
  "Туркестан",
  "Кокшетау",
  "Темиртау",
  "Талдыкорган",
];

const SORT_OPTIONS = [
  { id: "trust", name: "По уровню доверия" },
  { id: "price_asc", name: "По цене: сначала дешевые" },
  { id: "price_desc", name: "По цене: сначала дорогие" },
  { id: "newest", name: "По новизне: сначала свежие" },
  { id: "oldest", name: "По новизне: сначала старые" },
  { id: "views", name: "По популярности (просмотры)" },
  { id: "rating", name: "По отзывам продавца" },
];

const CAT_GPU = "Видеокарты";
const CAT_CPU = "Процессоры";
const CAT_PC = "Готовые ПК";

// "NVIDIA RTX 3070" -> "RTX 3070" (в БД модель хранится без бренда)
const stripBrand = (full) => {
  const i = full.indexOf(" ");
  return i === -1 ? full : full.slice(i + 1);
};

// "RTX 3070" -> "NVIDIA RTX 3070" (для ComponentPicker)
const addBrand = (presets, model) => {
  const brand = findBrandByModel(presets, model);
  return brand ? `${brand} ${model}` : null;
};

const splitParam = (v) => (v || "").split(",").filter(Boolean);

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCat = searchParams.get("cat") || searchParams.get("category") || "";

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(CATS.includes(initialCat) ? initialCat : "");
  const [city, setCity] = useState(searchParams.get("city") || "Актау");
  const [priceFrom, setPriceFrom] = useState(searchParams.get("priceFrom") || "");
  const [priceTo, setPriceTo] = useState(searchParams.get("priceTo") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  // Модели для категорий «Видеокарты» / «Процессоры» (в состоянии — с брендом)
  const [gpuModels, setGpuModels] = useState(() =>
    splitParam(searchParams.get("gpu_models"))
      .map((m) => addBrand(GPU_PRESETS, m))
      .filter(Boolean)
  );
  const [cpuModels, setCpuModels] = useState(() =>
    splitParam(searchParams.get("cpu_models"))
      .map((m) => addBrand(CPU_PRESETS, m))
      .filter(Boolean)
  );

  // Компоненты в готовых ПК (с брендом, как в БД)
  const [pcGpuModels, setPcGpuModels] = useState(() =>
    splitParam(searchParams.get("pc_gpu_models"))
  );
  const [pcCpuModels, setPcCpuModels] = useState(() =>
    splitParam(searchParams.get("pc_cpu_models"))
  );

  // Счётчики
  const [presetCounts, setPresetCounts] = useState(null);
  const [pcGpuCounts, setPcGpuCounts] = useState(null);
  const [pcCpuCounts, setPcCpuCounts] = useState(null);

  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  const cityRef = useRef(null);
  const filterRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (cityRef.current && !cityRef.current.contains(event.target)) {
        setIsCityOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Загрузка счётчиков при смене категории / города
  useEffect(() => {
    const cityParam = city && city !== "Весь Казахстан" ? city : "";
    let cancelled = false;

    const load = async (params, setter) => {
      try {
        const res = await fetch(`/api/preset-counts?${params.toString()}`);
        const data = await res.json();
        if (!cancelled) setter(res.ok ? data.counts || {} : null);
      } catch {
        if (!cancelled) setter(null);
      }
    };

    setPresetCounts(null);
    setPcGpuCounts(null);
    setPcCpuCounts(null);

    if (category === CAT_GPU || category === CAT_CPU) {
      const p = new URLSearchParams({ category });
      if (cityParam) p.set("city", cityParam);
      load(p, setPresetCounts);
    } else if (category === CAT_PC) {
      const g = new URLSearchParams({ componentType: "GPU" });
      const c = new URLSearchParams({ componentType: "CPU" });
      if (cityParam) {
        g.set("city", cityParam);
        c.set("city", cityParam);
      }
      load(g, setPcGpuCounts);
      load(c, setPcCpuCounts);
    }

    return () => {
      cancelled = true;
    };
  }, [category, city]);

  const filteredCities = KAZAKHSTAN_CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setGpuModels([]);
    setCpuModels([]);
    setPcGpuModels([]);
    setPcCpuModels([]);
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();

    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("cat", category);
    if (city && city !== "Весь Казахстан") params.set("city", city);
    if (priceFrom) params.set("priceFrom", priceFrom);
    if (priceTo) params.set("priceTo", priceTo);
    if (sort !== "newest") params.set("sort", sort);

    if (category === CAT_GPU && gpuModels.length > 0) {
      params.set("gpu_models", gpuModels.map(stripBrand).join(","));
    }
    if (category === CAT_CPU && cpuModels.length > 0) {
      params.set("cpu_models", cpuModels.map(stripBrand).join(","));
    }
    if (category === CAT_PC) {
      if (pcGpuModels.length > 0) params.set("pc_gpu_models", pcGpuModels.join(","));
      if (pcCpuModels.length > 0) params.set("pc_cpu_models", pcCpuModels.join(","));
    }

    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setPriceFrom("");
    setPriceTo("");
    setSort("newest");
  };

  const showModelBlock =
    category === CAT_GPU || category === CAT_CPU || category === CAT_PC;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-2xl relative z-30">
      <form onSubmit={handleSearch} className="flex flex-wrap lg:flex-nowrap items-center gap-2">

        {/* 1. Категории */}
        <div className="relative min-w-[160px] flex-1 lg:flex-none">
          <select
            value={category}
            onChange={handleCategoryChange}
            className="w-full h-11 bg-slate-950 text-slate-100 text-sm rounded-lg px-3 pr-8 border border-slate-800 focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-slate-100">
              Все категории
            </option>
            {CATS.map((name) => (
              <option key={name} value={name} className="bg-slate-900 text-slate-100">
                {name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 2. Город (Dropdown) */}
        <div className="relative min-w-[150px] flex-1 lg:flex-none" ref={cityRef}>
          <button
            type="button"
            onClick={() => setIsCityOpen(!isCityOpen)}
            className="w-full h-11 bg-slate-950 text-slate-100 text-sm rounded-lg px-3 border border-slate-800 flex items-center justify-between hover:border-cyan-500/50 transition"
          >
            <span className="flex items-center gap-1.5 truncate">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">{city}</span>
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {isCityOpen && (
            <div className="absolute top-12 left-0 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50">
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Поиск города..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full h-9 bg-slate-950 text-xs rounded-lg pl-8 pr-3 border border-slate-800 focus:outline-none focus:border-cyan-500 text-slate-100 placeholder:text-slate-400"
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {filteredCities.map((cityName) => (
                  <button
                    key={cityName}
                    type="button"
                    onClick={() => {
                      setCity(cityName);
                      setIsCityOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                      city === cityName
                        ? "bg-cyan-400 text-slate-950 font-bold"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span>{cityName}</span>
                    {city === cityName && <Check className="w-3.5 h-3.5 text-slate-950" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Поисковый инпут */}
        <div className="relative flex-1 min-w-[200px] w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Поиск по названию (например, RTX 3080)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 bg-slate-950 text-slate-100 text-sm rounded-lg pl-9 pr-3 border border-slate-800 focus:outline-none focus:border-cyan-500 placeholder:text-slate-400"
          />
        </div>

        {/* 4. Кнопка «Фильтры» */}
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`h-11 px-3.5 rounded-lg border text-sm flex items-center gap-2 transition ${
              priceFrom || priceTo || sort !== "newest"
                ? "border-cyan-500 bg-cyan-500/10 text-cyan-400 font-semibold"
                : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Фильтры</span>
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-sm font-semibold text-slate-100">Фильтры и сортировка</span>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="text-slate-400 hover:text-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Диапазон цен */}
              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-medium">Цена (₸)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="От"
                    value={priceFrom}
                    onChange={(e) => setPriceFrom(e.target.value)}
                    className="h-9 bg-slate-950 text-xs rounded-lg px-2.5 border border-slate-800 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="number"
                    placeholder="До"
                    value={priceTo}
                    onChange={(e) => setPriceTo(e.target.value)}
                    className="h-9 bg-slate-950 text-xs rounded-lg px-2.5 border border-slate-800 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Сортировка */}
              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-medium">Сортировка</label>
                <div className="space-y-1">
                  {SORT_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer text-xs text-slate-300"
                    >
                      <input
                        type="radio"
                        name="sort_option"
                        value={opt.id}
                        checked={sort === opt.id}
                        onChange={(e) => setSort(e.target.value)}
                        className="accent-cyan-400"
                      />
                      <span>{opt.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex-1 h-9 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-slate-100 transition"
                >
                  Сбросить
                </button>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="flex-1 h-9 rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs hover:bg-cyan-300 transition"
                >
                  Применить
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. Кнопка «Найти» */}
        <button
          type="submit"
          className="h-11 px-5 bg-cyan-400 text-slate-950 text-sm font-bold rounded-lg hover:bg-cyan-300 transition flex items-center justify-center shadow-lg shadow-cyan-500/10"
        >
          Найти
        </button>

        {/* 6. Кнопка «+ Создать объявление» */}
        <Link
          href="/new"
          className="h-11 px-4 bg-rose-500 text-white text-sm font-semibold rounded-lg hover:bg-rose-400 transition flex items-center gap-1.5 whitespace-nowrap ml-auto shadow-lg shadow-rose-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Создать объявление</span>
        </Link>
      </form>

      {/* Фильтры по моделям (зависят от категории) */}
      {showModelBlock && (
        <div className="mt-2.5 border-t border-slate-800 pt-2.5">
          {category === CAT_GPU && (
            <div className="max-w-sm">
              <ComponentPicker
                label="Доступные видеокарты"
                presets={GPU_PRESETS}
                value={gpuModels}
                onChange={setGpuModels}
                multiple
                hideBrandChips
                counts={presetCounts}
                placeholder="Все видеокарты"
              />
            </div>
          )}

          {category === CAT_CPU && (
            <div className="max-w-sm">
              <ComponentPicker
                label="Доступные процессоры"
                presets={CPU_PRESETS}
                value={cpuModels}
                onChange={setCpuModels}
                multiple
                hideBrandChips
                counts={presetCounts}
                placeholder="Все процессоры"
              />
            </div>
          )}

          {category === CAT_PC && (
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-300">
                Доступные комплектующие в сборках
              </p>
              <div className="grid gap-3 sm:grid-cols-2 max-w-2xl">
                <ComponentPicker
                  label="Видеокарта"
                  presets={GPU_PRESETS}
                  value={pcGpuModels}
                  onChange={setPcGpuModels}
                  multiple
                  hideBrandChips
                  counts={pcGpuCounts}
                  placeholder="Любая видеокарта"
                />
                <ComponentPicker
                  label="Процессор"
                  presets={CPU_PRESETS}
                  value={pcCpuModels}
                  onChange={setPcCpuModels}
                  multiple
                  hideBrandChips
                  counts={pcCpuCounts}
                  placeholder="Любой процессор"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
