"use client";

import { useState } from "react";
import Link from "next/link";
import ImageInput from "@/components/ImageInput";

const KAZAKHSTAN_CITIES = [
  "Актау",
  "Алматы",
  "Астана",
  "Шымкент",
  "Актобе",
  "Атырау",
  "Караганда",
  "Костанай",
  "Кызылорда",
  "Павлодар",
  "Петропавловск",
  "Семей",
  "Талдыкорган",
  "Тараз",
  "Уральск",
  "Усть-Каменогорск",
  "Жанаозен",
];

export default function NewListingFormClient({
  action,
  cats = [],
  types = [],
  defaultCity,
  defaultDistrict,
}) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e) => {
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const cat = selectedCategory.toLowerCase();

    // Считает файлы по имени поля (файлы с размером > 0)
    const getFilesCount = (key) => {
      const files = formData.getAll(key);
      return files.filter((f) => f && f.size > 0).length;
    };

    // 1. Фото товара
    const mainPhotosCount = getFilesCount("photos");
    if (mainPhotosCount === 0) {
      e.preventDefault();
      setErrorMessage("⚠️ Загрузите хотя бы 1 фотографию товара!");
      return;
    }
    if (mainPhotosCount > 6) {
      e.preventDefault();
      setErrorMessage("❌ Максимальное количество фото товара — 6 штук.");
      return;
    }

    // Определяем тип категории
    const isGpuCategory = cat.includes("видеокарт") || cat.includes("gpu");
    const isCpuCategory = cat.includes("процессор") || cat.includes("cpu");
    const isPcCategory =
      cat.includes("готов") ||
      cat.includes("пк") ||
      cat.includes("компьютер") ||
      cat.includes("сборка");

    // 2. Валидация тестов — с ЗАГЛАВНЫМИ буквами в именах полей (t_GPU_shots, t_CPU_shots)
    if (isGpuCategory) {
      const gpuShots = getFilesCount("t_GPU_shots");
      if (gpuShots < 2) {
        e.preventDefault();
        setErrorMessage(
          "⚠️ Для публикации видеокарты прикрепите минимум 2 фото/скриншота тестов (FurMark, GPU-Z, OCCT и т.д.)!"
        );
        return;
      }
    } else if (isCpuCategory) {
      const cpuShots = getFilesCount("t_CPU_shots");
      if (cpuShots < 2) {
        e.preventDefault();
        setErrorMessage(
          "⚠️ Для публикации процессора прикрепите минимум 2 фото/скриншота тестов (Cinebench, AIDA64, CPU-Z)!"
        );
        return;
      }
    } else if (isPcCategory) {
      const gpuShots = getFilesCount("t_GPU_shots");
      const cpuShots = getFilesCount("t_CPU_shots");
      if (gpuShots < 2 && cpuShots < 2) {
        e.preventDefault();
        setErrorMessage(
          "⚠️ Для готового ПК прикрепите минимум 2 фото тестов Видеокарты или Процессора!"
        );
        return;
      }
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit} className="w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
          Новое объявление
        </h1>
        <p className="text-slate-400 text-sm">
          Разместите видеокарту, ПК или комплектующие на AktauCyberPC
        </p>
      </div>

      {/* Основной блок */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-5 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-200 border-b border-slate-800/80 pb-3">
          Основная информация
        </h2>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Заголовок *</label>
          <input
            name="title"
            required
            maxLength={120}
            placeholder="Например: RTX 3070 Gigabyte Gaming OC"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Категория *</label>
            <select
              name="category"
              required
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm appearance-none cursor-pointer"
            >
              <option value="">Выберите категорию</option>
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Цена (₸) *</label>
            <input
              name="price"
              type="number"
              required
              min={0}
              placeholder="150000"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Описание *</label>
          <textarea
            name="description"
            required
            rows={5}
            maxLength={5000}
            placeholder="Укажите состояние, наличие чека/гарантии, комплектацию и причину продажи..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Город *</label>
            <select
              name="city"
              required
              defaultValue={defaultCity || "Актау"}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm appearance-none cursor-pointer"
            >
              {KAZAKHSTAN_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Адрес / Район / Микрорайон
            </label>
            <input
              name="district"
              defaultValue={defaultDistrict}
              placeholder="Например: 14 мкр, 28 дом или Медеуский р-н"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="pt-2">
          <span className="block text-xs font-medium text-slate-400 mb-2">
            Фотографии товара (макс. 6) *
          </span>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <ImageInput name="photos" maxFiles={6} />
          </div>
        </div>
      </div>

      {/* Блок тестов */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-4 shadow-xl">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">Проверенные компоненты</h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Прикрепите результаты стресс-тестов для повышения доверия покупателей.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {types.map(([k, name, hint]) => {
            const catLower = selectedCategory.toLowerCase();
            const isGpuCat = catLower.includes("видеокарт") || catLower.includes("gpu");
            const isCpuCat = catLower.includes("процессор") || catLower.includes("cpu");
            const isPcCat =
              catLower.includes("готов") ||
              catLower.includes("пк") ||
              catLower.includes("компьютер") ||
              catLower.includes("сборка");

            const isGpuItem = k === "GPU";   // ← заглавными, как в TYPES
            const isCpuItem = k === "CPU";   // ← заглавными

            const shouldOpen =
              (isGpuItem && (isGpuCat || isPcCat)) ||
              (isCpuItem && (isCpuCat || isPcCat));

            const isRequired =
              (isGpuItem && isGpuCat) ||
              (isCpuItem && isCpuCat) ||
              ((isGpuItem || isCpuItem) && isPcCat);

            return (
              <details
                key={k}
                open={shouldOpen}
                className="group border border-slate-800/80 rounded-xl bg-slate-950/80 overflow-hidden transition-all duration-200"
              >
                <summary className="p-4 cursor-pointer font-medium text-slate-200 hover:text-cyan-400 flex justify-between items-center select-none text-sm">
                  <span className="flex items-center gap-2">
                    {name}
                    {isRequired && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-sans font-normal">
                        мин. 2 фото тестов
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-slate-500 group-open:rotate-180 transition-transform duration-200">
                    ▼
                  </span>
                </summary>

                <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/40">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Название теста
                    </label>
                    <input
                      name={`t_${k}_title`}
                      placeholder={`Например: ${hint}`}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Результат
                    </label>
                    <select
                      name={`t_${k}_result`}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="PASSED">✅ Тест пройден</option>
                      <option value="FAILED">❌ Тест не пройден</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Показатели (каждый с новой строки)
                    </label>
                    <textarea
                      name={`t_${k}_metrics`}
                      rows={4}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                      placeholder={"Температура, °C: 71\nHot Spot, °C: 83\nСостояние: отлично"}
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-medium text-slate-400 mb-1">
                      Скриншоты и фото тестов
                    </span>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <ImageInput name={`t_${k}_shots`} maxFiles={6} />
                    </div>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>

      {/* Ошибка валидации */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium">
          {errorMessage}
        </div>
      )}

      {/* Кнопки */}
      <div className="flex gap-4 pt-2">
        <button
          type="submit"
          className="flex-1 py-3.5 px-6 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-[0.99] transition-all shadow-lg shadow-cyan-500/20 text-center cursor-pointer"
        >
          Опубликовать
        </button>
        <Link
          href="/"
          className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 active:scale-[0.99] transition-all text-center"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}