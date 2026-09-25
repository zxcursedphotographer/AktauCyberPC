"use client";

import Link from "next/link";
import ImageInput from "@/components/ImageInput";

const CITIES = [
  "Актау",
  "Алматы",
  "Астана",
  "Шымкент",
  "Караганда",
  "Актобе",
  "Атырау",
  "Павлодар",
  "Усть-Каменогорск",
  "Семей",
];

const AKTAU_DISTRICTS = Array.from({ length: 35 }, (_, i) => `${i + 1}-й микрорайон`);

export default function NewListingFormClient({ action, cats, types, defaultCity, defaultDistrict }) {
  return (
    <form action={action} className="w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
          Новое объявление
        </h1>
        <p className="text-slate-400 text-sm">
          Разместите видеокарту, ПК или комплектующие на AktauCyberPC
        </p>
      </div>

      {/* Основная информация */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-2">
          Основная информация
        </h2>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Заголовок *</label>
          <input
            name="title"
            required
            maxLength={120}
            placeholder="Например: RTX 3070 Gigabyte Gaming OC"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Категория *</label>
            <select
              name="category"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
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
            <label className="block text-xs font-medium text-slate-400 mb-1">Цена (₸) *</label>
            <input
              name="price"
              type="number"
              required
              min={0}
              placeholder="150000"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Описание *</label>
          <textarea
            name="description"
            required
            rows={5}
            maxLength={5000}
            placeholder="Укажите состояние, наличие чека/гарантии, комплектацию и причину продажи..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
          />
        </div>

        {/* Локация */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Город</label>
            <input
              name="city"
              list="cities-list"
              defaultValue={defaultCity}
              placeholder="Актау"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <datalist id="cities-list">
              {CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Микрорайон</label>
            <input
              name="district"
              list="districts-list"
              defaultValue={defaultDistrict}
              placeholder="Например: 14-й микрорайон"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <datalist id="districts-list">
              {AKTAU_DISTRICTS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Загрузка фото товара */}
        <div className="pt-2">
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Фотографии товара
          </label>
          <ImageInput name="photos" multiple className="w-full" />
        </div>
      </div>

      {/* Проверенные компоненты (Тесты) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">Проверенные компоненты</h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Заполните только то, что вы лично проверили. Пустые блоки не будут отображаться.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {types.map(([k, name, hint]) => (
            <details
              key={k}
              className="group border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden transition-all duration-200"
            >
              <summary className="p-4 cursor-pointer font-medium text-slate-200 hover:text-cyan-400 flex justify-between items-center select-none">
                <span>{name}</span>
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
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
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
                    placeholder={"Температура GPU, °C: 71\nHot Spot, °C: 83\nМайнинг: не использовалась"}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Скриншоты и фото тестов
                  </label>
                  <ImageInput name={`t_${k}_shots`} multiple className="w-full" />
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Кнопки */}
      <div className="flex gap-4 pt-2">
        <button
          type="submit"
          className="flex-1 py-3 px-6 rounded-xl font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-[0.99] transition-all shadow-lg shadow-cyan-500/20 text-center"
        >
          Опубликовать
        </button>
        <Link
          href="/"
          className="flex-1 py-3 px-6 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 active:scale-[0.99] transition-all text-center"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}