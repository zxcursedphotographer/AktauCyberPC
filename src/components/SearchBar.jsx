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
  Check
} from "lucide-react";

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
  "Талдыкорган"
];

const CATEGORIES = [
  { id: "ALL", name: "Все категории" },
  { id: "GPU", name: "Видеокарты" },
  { id: "CPU", name: "Процессоры" },
  { id: "RAM", name: "Оперативная память" },
  { id: "STORAGE", name: "Накопители (SSD/HDD)" },
  { id: "MOTHERBOARD", name: "Материнские платы" }
];

const SORT_OPTIONS = [
  { id: "trust", name: "По уровню доверия" },
  { id: "price_asc", name: "По цене: сначала дешевые" },
  { id: "price_desc", name: "По цене: сначала дорогие" },
  { id: "newest", name: "По новизне: сначала свежие" },
  { id: "oldest", name: "По новизне: сначала старые" },
  { id: "views", name: "По популярности (просмотры)" },
  { id: "rating", name: "По отзывам продавца" }
];

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Состояние формы
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "ALL");
  const [city, setCity] = useState(searchParams.get("city") || "Актау");
  const [priceFrom, setPriceFrom] = useState(searchParams.get("priceFrom") || "");
  const [priceTo, setPriceTo] = useState(searchParams.get("priceTo") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  // UI Состояния Dropdown
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  const cityRef = useRef(null);
  const filterRef = useRef(null);

  // Закрытие при клике вне дропдауна
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

  const filteredCities = KAZAKHSTAN_CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();

    if (query.trim()) params.set("q", query.trim());
    if (category !== "ALL") params.set("category", category);
    if (city && city !== "Весь Казахстан") params.set("city", city);
    if (priceFrom) params.set("priceFrom", priceFrom);
    if (priceTo) params.set("priceTo", priceTo);
    if (sort !== "newest") params.set("sort", sort);

    router.push(`/?${params.toString()}`);
    setIsFilterOpen(false);
  };

  const handleResetFilters = () => {
    setPriceFrom("");
    setPriceTo("");
    setSort("newest");
  };

  return (
    <div className="w-full bg-panel border border-white/10 rounded-xl p-2.5 shadow-2xl relative z-30">
      <form onSubmit={handleSearch} className="flex flex-wrap lg:flex-nowrap items-center gap-2">
        
        {/* 1. Категории */}
        <div className="relative min-w-[160px] flex-1 lg:flex-none">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-11 bg-ink/80 text-white text-sm rounded-lg px-3 pr-8 border border-white/10 focus:outline-none focus:border-accent appearance-none cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-panel text-white">
                {cat.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 2. Город (Dropdown) */}
        <div className="relative min-w-[150px] flex-1 lg:flex-none" ref={cityRef}>
          <button
            type="button"
            onClick={() => setIsCityOpen(!isCityOpen)}
            className="w-full h-11 bg-ink/80 text-white text-sm rounded-lg px-3 border border-white/10 flex items-center justify-between hover:border-accent transition"
          >
            <span className="flex items-center gap-1.5 truncate">
              <MapPin className="w-4 h-4 text-accent shrink-0" />
              <span className="truncate">{city}</span>
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          </button>

          {isCityOpen && (
            <div className="absolute top-12 left-0 w-72 bg-panel border border-white/10 rounded-xl shadow-2xl p-3 z-50">
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Поиск города..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full h-9 bg-ink text-xs rounded-lg pl-8 pr-3 border border-white/10 focus:outline-none focus:border-accent text-white"
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
                      city === cityName ? "bg-accent text-white font-medium" : "text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    <span>{cityName}</span>
                    {city === cityName && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Поисковый инпут */}
        <div className="relative flex-1 min-w-[200px] w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Поиск по названию (например, RTX 3080)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 bg-ink/80 text-white text-sm rounded-lg pl-9 pr-3 border border-white/10 focus:outline-none focus:border-accent placeholder:text-gray-500"
          />
        </div>

        {/* 4. Кнопка «Фильтры» */}
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`h-11 px-3.5 rounded-lg border text-sm flex items-center gap-2 transition ${
              priceFrom || priceTo || sort !== "newest"
                ? "border-accent bg-accent/20 text-accent"
                : "border-white/10 bg-ink/80 text-gray-300 hover:border-white/20"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Фильтры</span>
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 top-12 w-80 bg-panel border border-white/10 rounded-xl shadow-2xl p-4 z-50 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-sm font-semibold text-white">Фильтры и сортировка</span>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Диапазон цен */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-medium">Цена (₸)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="От"
                    value={priceFrom}
                    onChange={(e) => setPriceFrom(e.target.value)}
                    className="h-9 bg-ink text-xs rounded-lg px-2.5 border border-white/10 text-white focus:outline-none focus:border-accent"
                  />
                  <input
                    type="number"
                    placeholder="До"
                    value={priceTo}
                    onChange={(e) => setPriceTo(e.target.value)}
                    className="h-9 bg-ink text-xs rounded-lg px-2.5 border border-white/10 text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Сортировка */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 font-medium">Сортировка</label>
                <div className="space-y-1">
                  {SORT_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-xs text-gray-300"
                    >
                      <input
                        type="radio"
                        name="sort_option"
                        value={opt.id}
                        checked={sort === opt.id}
                        onChange={(e) => setSort(e.target.value)}
                        className="accent-accent"
                      />
                      <span>{opt.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex-1 h-9 rounded-lg border border-white/10 text-xs text-gray-400 hover:text-white transition"
                >
                  Сбросить
                </button>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="flex-1 h-9 rounded-lg bg-accent text-white font-medium text-xs hover:opacity-90 transition"
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
          className="h-11 px-5 bg-accent text-white text-sm font-medium rounded-lg hover:opacity-90 transition flex items-center justify-center"
        >
          Найти
        </button>

        {/* 6. Кнопка «+ Создать объявление» */}
        <Link
          href="/new"
          className="h-11 px-4 bg-hot text-white text-sm font-semibold rounded-lg hover:opacity-90 transition flex items-center gap-1.5 whitespace-nowrap ml-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Создать объявление</span>
        </Link>
      </form>
    </div>
  );
}