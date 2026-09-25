"use client";

import { useState } from "react";
import { updateListing, addListingImage, removeListingImage, deleteListing, markSold } from "@/app/actions";
import ImageInput from "./ImageInput";

export default function ListingTools({ l, sa, buyers = [] }) {
  // Режим редактирования: 'quick' (частичное) или 'full' (полное с тестами)
  const [editMode, setEditMode] = useState("quick");
  const [selectedCategory, setSelectedCategory] = useState(l.category || "gpu");

  return (
    <details className={`card overflow-hidden transition-all duration-200 ${sa ? "!border-hot/50 bg-hot/5" : "!border-accent/40 bg-slate-500/5"}`}>
      <summary className="cursor-pointer select-none font-bold text-sm flex items-center justify-between p-1 text-slate-900 dark:text-slate-100">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${sa ? "bg-hot animate-pulse" : "bg-accent"}`} />
          {sa ? (
            <span className="text-hot">Управление объявлением (Админ)</span>
          ) : (
            <span>Управление объявлением</span>
          )}
        </div>
        <span className="text-xs text-slate-400 font-normal">Панель автора</span>
      </summary>

      <div className="mt-4 space-y-6 pt-4 border-t border-slate-200 dark:border-white/10">
        
        {/* Переключатель режимов: Быстрое / Полное редактирование */}
        <div className="flex bg-black/20 p-1 rounded-lg gap-1 border border-white/10">
          <button
            type="button"
            onClick={() => setEditMode("quick")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
              editMode === "quick" ? "bg-accent text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            ⚡ Быстрое изменение
          </button>
          <button
            type="button"
            onClick={() => setEditMode("full")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
              editMode === "full" ? "bg-accent text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            ⚙️ Полное редактирование + Тесты
          </button>
        </div>

        {/* ------------------- БЫСТРОЕ РЕДАКТИРОВАНИЕ ------------------- */}
        {editMode === "quick" && (
          <form action={updateListing} className="space-y-3">
            <input type="hidden" name="id" value={l.id} />
            <input type="hidden" name="mode" value="quick" />

            <div>
              <label className="text-[11px] font-medium text-slate-400">Название</label>
              <input name="title" defaultValue={l.title} className="input text-xs w-full mt-0.5" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-400">Цена (₸)</label>
                <input name="price" type="number" defaultValue={l.price} className="input text-xs w-full mt-0.5" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400">Город</label>
                <input name="city" defaultValue={l.city || "Актау"} className="input text-xs w-full mt-0.5" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400">Краткое описание</label>
              <textarea name="description" defaultValue={l.description} rows={3} className="input text-xs w-full resize-none mt-0.5" />
            </div>

            <button className="btn text-xs py-2 px-4 bg-accent text-white font-medium w-full">
              Сохранить быстрые правки
            </button>
          </form>
        )}

        {/* ------------------- ПОЛНОЕ РЕДАКТИРОВАНИЕ (С ТЕСТАМИ) ------------------- */}
        {editMode === "full" && (
          <form action={updateListing} className="space-y-4">
            <input type="hidden" name="id" value={l.id} />
            <input type="hidden" name="mode" value="full" />

            <div className="space-y-3">
              <h4 className="text-xs uppercase font-bold text-slate-400">1. Основная информация</h4>
              <input name="title" defaultValue={l.title} className="input text-xs w-full" placeholder="Заголовок" />
              
              <div className="grid grid-cols-2 gap-2">
                <select 
                  name="category" 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input text-xs w-full"
                >
                  <option value="gpu">Видеокарта</option>
                  <option value="cpu">Процессор</option>
                  <option value="ram">Оперативная память</option>
                  <option value="ssd">Накопитель (SSD/HDD)</option>
                  <option value="motherboard">Материнская плата</option>
                  <option value="other">Готовый ПК / Другое</option>
                </select>

                <input name="price" type="number" defaultValue={l.price} className="input text-xs w-full" placeholder="Цена, ₸" />
              </div>

              <textarea name="description" defaultValue={l.description} rows={4} className="input text-xs w-full resize-none" placeholder="Состояние, комплект, гарантия..." />
            </div>

            {/* Блок обязательных тестов компонентов */}
            <div className="space-y-3 p-3 rounded-xl bg-slate-900/40 border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  2. Результаты тестов ({selectedCategory.toUpperCase()})
                </h4>
                <span className="text-[10px] text-emerald-500/80 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Фишка платформы
                </span>
              </div>

              {/* Тест для Видеокарт */}
              {selectedCategory === "gpu" && (
                <div className="space-y-2 text-xs">
                  <input name="testName" defaultValue={l.testName || "FurMark / Superposition"} className="input text-xs w-full" placeholder="Название бенчмарка" />
                  <textarea 
                    name="testMetrics" 
                    defaultValue={l.testMetrics || "Температура GPU, °C: \nHot Spot, °C: \nМайнинг: не использовалась"} 
                    rows={3} 
                    className="input text-xs w-full resize-none font-mono" 
                  />
                </div>
              )}

              {/* Тест для Процессоров */}
              {selectedCategory === "cpu" && (
                <div className="space-y-2 text-xs">
                  <input name="testName" defaultValue={l.testName || "AIDA64 Stress FPU / OCCT"} className="input text-xs w-full" placeholder="Название стресс-теста" />
                  <textarea 
                    name="testMetrics" 
                    defaultValue={l.testMetrics || "Макс. температура, °C: \nПиковое потребление, W: \nТроттлинг: отсутствует"} 
                    rows={3} 
                    className="input text-xs w-full resize-none font-mono" 
                  />
                </div>
              )}

              {/* Тесты для RAM/SSD/Плат */}
              {["ram", "ssd", "motherboard", "other"].includes(selectedCategory) && (
                <div className="space-y-2 text-xs">
                  <input name="testName" defaultValue={l.testName || "TestMem5 / CrystalDiskInfo / AIDA64"} className="input text-xs w-full" placeholder="Название теста" />
                  <textarea 
                    name="testMetrics" 
                    defaultValue={l.testMetrics || "Ошибки: 0\nЗдоровье, %: 100\nВремя работы, ч: "} 
                    rows={3} 
                    className="input text-xs w-full resize-none font-mono" 
                  />
                </div>
              )}
            </div>

            <button className="btn text-xs py-2.5 px-4 !bg-emerald-600 text-white font-bold w-full hover:!bg-emerald-500">
              Сохранить всё (включая тесты)
            </button>
          </form>
        )}

        <hr className="border-slate-200 dark:border-white/10" />

        {/* ------------------- ФОТОГРАФИИ И ТЕСТОВЫЕ СКРИНЫ ------------------- */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase font-bold text-slate-400">Галерея товара и скриншоты тестов</h4>
          
          {l.images?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {l.images.map((i) => (
                <form key={i.id} action={removeListingImage} className="relative group rounded-lg overflow-hidden border border-white/10">
                  <input type="hidden" name="id" value={i.id} />
                  <img src={i.url} alt="" className="h-16 w-16 object-cover" />
                  <button 
                    title="Удалить" 
                    className="absolute inset-0 bg-hot/80 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>
                </form>
              ))}
            </div>
          )}

          <form action={addListingImage} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={l.id} />
            <div className="flex-1 min-w-[180px]">
              <ImageInput name="photo" required className="text-xs" />
            </div>
            <button className="btn text-xs py-2 px-3 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shrink-0">
              + Добавить фото/скрин
            </button>
          </form>
        </div>

        <hr className="border-slate-200 dark:border-white/10" />

        {/* ------------------- СТАТУС ПРОДАЖИ ------------------- */}
        <div className="space-y-2">
          <h4 className="text-xs uppercase font-bold text-slate-400">Статус сделки</h4>
          {l.status === "SOLD" ? (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 font-semibold">
              ✅ Продано {buyers.find((b) => b.id === l.buyerId) ? `покупателю: ${buyers.find((b) => b.id === l.buyerId).username}` : ""}
            </div>
          ) : (
            <form action={markSold} className="flex gap-2">
              <input type="hidden" name="id" value={l.id} />
              <select name="buyerId" className="input text-xs flex-1">
                <option value="">Выберите покупателя из чата…</option>
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>{b.username}</option>
                ))}
              </select>
              <button className="btn text-xs py-2 px-3 !bg-emerald-600 text-white font-semibold">
                Отметить проданным
              </button>
            </form>
          )}
        </div>

        {/* ------------------- АДМИН ПАНЕЛЬ ------------------- */}
        {sa && (
          <form action={deleteListing} className="p-3 rounded-lg bg-hot/10 border border-hot/30 space-y-2">
            <input type="hidden" name="id" value={l.id} />
            <input type="hidden" name="back" value="/admin" />
            <div className="text-xs font-bold text-hot uppercase">Модерация (Администратор)</div>
            <div className="flex gap-2">
              <select name="reason" required className="input text-xs flex-1">
                <option value="">Причина удаления…</option>
                <option value="1">Недействительные/фейковые тесты</option>
                <option value="2">Неправильное оформление</option>
                <option value="3">Мошенничество</option>
              </select>
              <button className="btn text-xs py-2 px-3 !bg-hot text-white font-bold">
                Удалить
              </button>
            </div>
          </form>
        )}

      </div>
    </details>
  );
}