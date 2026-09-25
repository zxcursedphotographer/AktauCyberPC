"use client";

import { useState } from "react";
import Link from "next/link";
import ImageInput from "@/components/ImageInput";
import { CAT_TO_TYPE } from "@/lib/constants";

const REQUIRED_TEST_CATEGORIES = ["Видеокарты", "Процессоры", "Готовые ПК"];

export default function NewListingFormClient({
  action,
  cats = [],
  types = [],
  cities = [],
  defaultCity,
  defaultDistrict,
}) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e) => {
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const cat = selectedCategory.toLowerCase();

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

    // 2. Обязательные тесты по категории
    const isGpuCategory = cat.includes("видеокарт") || cat.includes("gpu");
    const isCpuCategory = cat.includes("процессор") || cat.includes("cpu");
    const isPcCategory = cat.includes("готов") || cat.includes("пк") || cat.includes("сборка");

    if (isGpuCategory) {
      if (getFilesCount("t_GPU_shots") < 2) {
        e.preventDefault();
        setErrorMessage("⚠️ Для видеокарты прикрепите минимум 2 скриншота тестов (FurMark, GPU-Z, OCCT)!");
        return;
      }
    } else if (isCpuCategory) {
      if (getFilesCount("t_CPU_shots") < 2) {
        e.preventDefault();
        setErrorMessage("⚠️ Для процессора прикрепите минимум 2 скриншота тестов (Cinebench, AIDA64, CPU-Z)!");
        return;
      }
    } else if (isPcCategory) {
      const gpu = getFilesCount("t_GPU_shots");
      const cpu = getFilesCount("t_CPU_shots");
      if (gpu < 2 && cpu < 2) {
        e.preventDefault();
        setErrorMessage("⚠️ Для готового ПК прикрепите минимум 2 скриншота тестов Видеокарты или Процессора!");
        return;
      }
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit} className="w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Новое объявление</h1>
        <p className="mt-1 text-sm text-slate-400">
          Разместите видеокарту, ПК или комплектующие на AktauCyberPC
        </p>
      </div>

      {/* Основной блок */}
      <div className="card space-y-5">
        <h2 className="border-b border-white/10 pb-3 text-lg font-semibold">
          Основная информация
        </h2>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Заголовок *</label>
          <input
            name="title"
            required
            maxLength={120}
            placeholder="Например: RTX 3070 Gigabyte Gaming OC"
            className="input"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Категория *</label>
            <select
              name="category"
              required
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input cursor-pointer"
            >
              <option value="">Выберите категорию</option>
              {cats.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Цена (₸) *</label>
            <input
              name="price"
              type="number"
              required
              min={0}
              max={2000000000}
              placeholder="150000"
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Описание *</label>
          <textarea
            name="description"
            required
            rows={5}
            maxLength={5000}
            placeholder="Укажите состояние, наличие чека/гарантии, комплектацию и причину продажи..."
            className="input resize-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Город *</label>
            <select
              name="city"
              required
              defaultValue={defaultCity || "Актау"}
              className="input cursor-pointer"
            >
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Адрес / Район / Микрорайон
            </label>
            <input
              name="district"
              defaultValue={defaultDistrict}
              placeholder="Например: 14 мкр, 28 дом"
              className="input"
            />
          </div>
        </div>

        <div className="pt-2">
          <span className="mb-2 block text-xs font-medium text-slate-400">
            Фотографии товара (макс. 6) *
          </span>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <ImageInput name="photos" maxFiles={6} />
          </div>
        </div>
      </div>

      {/* Блок тестов */}
      <div className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Проверенные компоненты</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Прикрепите результаты стресс-тестов для повышения доверия покупателей.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {types.map(([k, name, hint]) => {
            const catLower = selectedCategory.toLowerCase();
            const isGpuCat = catLower.includes("видеокарт") || catLower.includes("gpu");
            const isCpuCat = catLower.includes("процессор") || catLower.includes("cpu");
            const isPcCat = catLower.includes("готов") || catLower.includes("пк") || catLower.includes("сборка");

            const isGpuItem = k === "GPU";
            const isCpuItem = k === "CPU";

            const shouldOpen = (isGpuItem && (isGpuCat || isPcCat)) || (isCpuItem && (isCpuCat || isPcCat));
            const isRequired = (isGpuItem && isGpuCat) || (isCpuItem && isCpuCat) || ((isGpuItem || isCpuItem) && isPcCat);

            return (
              <details
                key={k}
                open={shouldOpen}
                className="group overflow-hidden rounded-xl border border-white/10 bg-black/20 transition-all"
              >
                <summary className="flex cursor-pointer select-none items-center justify-between p-4 text-sm font-medium hover:text-accent">
                  <span className="flex items-center gap-2">
                    {name}
                    {isRequired && (
                      <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-normal text-accent">
                        мин. 2 фото тестов
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-slate-500 transition-transform group-open:rotate-180">▼</span>
                </summary>

                <div className="space-y-3 border-t border-white/10 bg-black/20 p-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">Название теста</label>
                    <input
                      name={`t_${k}_title`}
                      placeholder={`Например: ${hint}`}
                      className="input text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">Результат</label>
                    <select name={`t_${k}_result`} className="input cursor-pointer text-sm">
                      <option value="PASSED">✅ Тест пройден</option>
                      <option value="FAILED">❌ Тест не пройден</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">
                      Показатели (каждый с новой строки)
                    </label>
                    <textarea
                      name={`t_${k}_metrics`}
                      rows={4}
                      className="input resize-none font-mono text-sm"
                      placeholder={"Температура, °C: 71\nHot Spot, °C: 83\nСостояние: отлично"}
                    />
                  </div>

                  <div>
                    <span className="mb-1 block text-xs font-medium text-slate-400">
                      Скриншоты и фото тестов
                    </span>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
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
        <div className="rounded-xl border border-hot/30 bg-hot/10 p-4 text-sm font-medium text-hot">
          {errorMessage}
        </div>
      )}

      {/* Кнопки */}
      <div className="flex gap-4 pt-2">
        <button type="submit" className="btn flex-1 py-3.5 text-center">
          Опубликовать
        </button>
        <Link
          href="/"
          className="flex-1 rounded-xl border border-white/20 bg-slate-900 px-6 py-3.5 text-center font-semibold text-slate-300 transition hover:bg-slate-800"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}