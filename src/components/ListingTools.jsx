"use client";

import { useState } from "react";
import { CITIES, CATS, CAT_TO_TYPE } from "@/lib/constants";
import {
  updateListing,
  addListingImage,
  removeListingImage,
  deleteListing,
  markSold,
  removeTestImage,
  setTestResult,
  resubmitListing,
} from "@/app/actions";
import ImageInput from "@/components/ImageInput";
import { Trash2, Clock, AlertTriangle, Send } from "lucide-react";

const STATUS_INFO = {
  PUBLISHED: { label: "Опубликовано", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400", icon: "✅" },
  UNDER_REVIEW: { label: "На модерации", cls: "border-amber-500/40 bg-amber-500/10 text-amber-400", icon: "⏳" },
  NEEDS_EDIT: { label: "Требует правок", cls: "border-orange-500/40 bg-orange-500/10 text-orange-400", icon: "⚠️" },
  SOLD: { label: "Продано", cls: "border-blue-500/40 bg-blue-500/10 text-blue-400", icon: "💰" },
  DELETED: { label: "Удалено", cls: "border-hot/40 bg-hot/10 text-hot", icon: "❌" },
  APPEAL: { label: "На апелляции", cls: "border-amber-500/40 bg-amber-500/10 text-amber-400", icon: "📩" },
  HIDDEN: { label: "Скрыто", cls: "border-slate-500/40 bg-slate-500/10 text-slate-400", icon: "🙈" },
  DRAFT: { label: "Черновик", cls: "border-slate-500/40 bg-slate-500/10 text-slate-400", icon: "📝" },
};

export default function ListingTools({ l, sa, buyers = [] }) {
  const [category, setCategory] = useState(l.category || CATS[0]);

  const currentType = CAT_TO_TYPE[category];
  const currentTest = l.tests?.find((t) => t.componentType === currentType) || l.tests?.[0];

  const initialMetrics = currentTest?.metrics
    ? typeof currentTest.metrics === "string"
      ? currentTest.metrics
      : JSON.stringify(currentTest.metrics, null, 2)
    : "";

  const statusInfo = STATUS_INFO[l.status] || STATUS_INFO.DRAFT;
  const isNeedsEdit = l.status === "NEEDS_EDIT";
  const isReview = l.status === "UNDER_REVIEW";

  return (
    <details
      className={`card group overflow-hidden transition-all ${
        sa ? "!border-hot/50 bg-hot/5" : "!border-accent/40 bg-accent/5"
      }`}
    >
      <summary className="flex cursor-pointer select-none items-center justify-between p-3 transition hover:bg-white/5">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
          <span className={`h-2.5 w-2.5 rounded-full ${sa ? "animate-pulse bg-hot" : "bg-accent"}`} />
          {sa ? <span className="text-hot">Управление объявлением (Админ)</span> : <span>Управление объявлением</span>}
          <span className={`ml-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusInfo.cls}`}>
            {statusInfo.icon} {statusInfo.label}
          </span>
        </div>
        <span className="text-xs opacity-60">
          {sa ? "Модерация" : "Панель автора"}
          <span className="ml-2 inline-block transition-transform group-open:rotate-180">▼</span>
        </span>
      </summary>

      <div className="mt-4 space-y-6 border-t border-white/10 p-4 pt-4">
        {isNeedsEdit && (
          <div className="rounded-lg border border-orange-500/40 bg-orange-500/10 p-3 text-sm">
            <div className="flex items-center gap-2 font-bold text-orange-400">
              <AlertTriangle size={16} /> Требует правок
            </div>
            {l.moderationNote && <p className="mt-1 opacity-90">Причина от админа: {l.moderationNote}</p>}
            <p className="mt-2 text-xs opacity-70">Исправьте объявление и нажмите «Отправить на проверку».</p>
          </div>
        )}

        {isReview && !sa && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <Clock size={16} /> Объявление на модерации
            </div>
            <p className="mt-1 text-xs opacity-80">
              Обычно проверка занимает до 24 часов. После одобрения объявление появится в активных.
            </p>
          </div>
        )}

        {/* ========== 1. ОСНОВНАЯ ФОРМА ========== */}
        <form action={updateListing} className="space-y-5">
          <input type="hidden" name="id" value={l.id} />

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-accent">1. Основная информация</h4>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Название</label>
              <input name="title" defaultValue={l.title} required maxLength={120} className="input text-sm" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Категория</label>
                <select
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input text-sm"
                >
                  {CATS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Цена (₸)</label>
                <input
                  name="price"
                  type="number"
                  defaultValue={l.price}
                  required
                  min={0}
                  max={2000000000}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Город</label>
                <select name="city" defaultValue={l.city || "Актау"} className="input text-sm">
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Район / Микрорайон</label>
              <input name="district" defaultValue={l.district || ""} placeholder="Например: 12 мкр" className="input text-sm" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Описание</label>
              <textarea
                name="description"
                rows={4}
                defaultValue={l.description}
                maxLength={5000}
                required
                className="input resize-none text-sm"
              />
            </div>
          </div>

          {/* ========== 2. ТЕСТЫ ========== */}
          <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">2. Результаты тестов</h4>
              {currentTest && (
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${
                    currentTest.resultStatus === "PASSED"
                      ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                      : "border-hot/30 bg-hot/20 text-hot"
                  }`}
                >
                  {currentTest.resultStatus === "PASSED" ? "✅ Пройден" : "❌ Не пройден"}
                </span>
              )}
            </div>

            {!sa && currentTest && (
              <p className="rounded border border-white/10 bg-white/5 p-2 text-[11px] opacity-70">
                🛡️ Статус «Пройден / Не пройден» проверяет и выставляет администрация.
              </p>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Название программы / теста</label>
              <input
                name="testTitle"
                defaultValue={currentTest?.testTitle || ""}
                placeholder="FurMark / AIDA64 / CrystalDiskInfo"
                required
                className="input text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">
                Показатели (параметр: значение, каждый с новой строки)
              </label>
              <textarea
                name="testMetrics"
                defaultValue={initialMetrics}
                rows={3}
                required
                placeholder={"Температура GPU, °C: 68\nHot Spot, °C: 78"}
                className="input resize-none font-mono text-xs"
              />
            </div>

            {/* Существующие скриншоты теста — выносим формы наружу */}
            {currentTest?.mediaUrls?.length > 0 && (
              <div className="space-y-2 pt-1">
                <label className="text-xs font-medium text-slate-400">Загруженные скриншоты теста:</label>
                <div className="flex flex-wrap gap-2">
                  {currentTest.mediaUrls.map((url, idx) => (
                    <button
                      key={url + idx}
                      type="button"
                      onClick={async () => {
                        const fd = new FormData();
                        fd.append("testId", currentTest.id);
                        fd.append("url", url);
                        await removeTestImage(fd);
                      }}
                      className="group relative h-20 w-20 overflow-hidden rounded-lg border border-white/10"
                      title="Удалить скриншот"
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center gap-1 bg-hot/80 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100">
                        <Trash2 size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Добавить скриншоты теста</label>
              <ImageInput name="testImages" maxFiles={6} />
            </div>
          </div>

          <button className="btn w-full justify-center py-2.5 text-sm font-bold">
            Сохранить изменения
          </button>
        </form>

        {/* Решение админа по тесту — отдельная форма ВНЕ основной */}
        {sa && currentTest && (
          <form
            action={setTestResult}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-hot/30 bg-hot/5 p-3"
          >
            <input type="hidden" name="testId" value={currentTest.id} />
            <span className="text-xs font-semibold text-hot">🛡️ Решение админа:</span>
            <select name="result" defaultValue={currentTest.resultStatus} className="input !w-40 !py-1 !text-xs">
              <option value="PASSED">✅ Пройден</option>
              <option value="FAILED">❌ Не пройден</option>
            </select>
            <button className="btn !bg-hot px-3 py-1 text-xs">Зафиксировать</button>
          </form>
        )}

        {isNeedsEdit && !sa && (
          <form action={resubmitListing}>
            <input type="hidden" name="id" value={l.id} />
            <button className="btn w-full justify-center !bg-emerald-600 py-2.5 text-sm font-bold text-white">
              <Send size={16} className="mr-1" /> Отправить на проверку снова
            </button>
          </form>
        )}

        <hr className="border-white/10" />

        {/* ========== 3. ФОТО ТОВАРА ========== */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Фото товара</h4>

          {l.images?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {l.images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={async () => {
                    const fd = new FormData();
                    fd.append("id", img.id);
                    await removeListingImage(fd);
                  }}
                  className="group relative overflow-hidden rounded-lg border border-white/10"
                  title="Удалить фото"
                >
                  <img src={img.url} alt="" className="h-16 w-16 object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-hot/80 text-white opacity-0 transition group-hover:opacity-100">
                    <Trash2 size={16} />
                  </span>
                </button>
              ))}
            </div>
          )}

          <form action={addListingImage} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={l.id} />
            <div className="min-w-[180px] flex-1">
              <ImageInput name="photo" required className="text-xs" />
            </div>
            <button className="btn shrink-0 px-3 py-2 text-xs">+ Добавить</button>
          </form>
        </div>

        <hr className="border-white/10" />

        {/* ========== 4. СТАТУС СДЕЛКИ ========== */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">4. Статус сделки</h4>
          {l.status === "SOLD" ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-semibold text-emerald-400">
              ✅ Продано
              {buyers.find((b) => b.id === l.buyerId) ? ` покупателю: ${buyers.find((b) => b.id === l.buyerId).username}` : ""}
            </div>
          ) : (
            <form action={markSold} className="flex gap-2">
              <input type="hidden" name="id" value={l.id} />
              <select name="buyerId" className="input flex-1 text-xs">
                <option value="">Выберите покупателя из чата…</option>
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>{b.username}</option>
                ))}
              </select>
              <button className="btn !bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Отметить проданным</button>
            </form>
          )}
        </div>

        {/* ========== 5. АДМИН ========== */}
        {sa && (
          <form action={deleteListing} className="space-y-2 rounded-lg border border-hot/30 bg-hot/10 p-3">
            <input type="hidden" name="id" value={l.id} />
            <input type="hidden" name="back" value="/admin" />
            <div className="text-xs font-bold uppercase tracking-wider text-hot">Модерация (только админ)</div>
            <div className="flex gap-2">
              <select name="reason" required className="input flex-1 text-xs">
                <option value="">Причина удаления…</option>
                <option value="1">Недействительные/фейковые тесты</option>
                <option value="2">Неправильное оформление</option>
                <option value="3">Мошенничество</option>
              </select>
              <button className="btn !bg-hot px-3 py-2 text-xs font-bold text-white">Удалить</button>
            </div>
          </form>
        )}
      </div>
    </details>
  );
}