"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import {
  updateListing,
  resubmitListing,
  markSold,
  hideListings,
  unhideListing,
  deleteOwnListings,
  deleteListing,
  approveListing,
  requestListingChanges,
  rejectListing,
  addListingImage,
  removeListingImage,
  removeTestImage,
  deleteTest,
  setTestResult,
  appealListing,
} from "@/app/actions";
import {
  CATS,
  CITIES,
  GPU_PRESETS,
  CPU_PRESETS,
  RAM_PRESETS,
  MOTHERBOARD_PRESETS,
  PSU_PRESETS,
  COMPONENT_LABELS,
  PC_BUILD_COMPONENTS,
} from "@/lib/constants";

const PRESETS_BY_COMPONENT = {
  GPU: GPU_PRESETS,
  CPU: CPU_PRESETS,
  RAM: RAM_PRESETS,
  MOTHERBOARD: MOTHERBOARD_PRESETS,
  PSU: PSU_PRESETS,
};

const CATEGORY_SINGLE_COMPONENT = {
  "Видеокарты": "GPU",
  "Процессоры": "CPU",
  "Оперативная память": "RAM",
  "Материнские платы": "MOTHERBOARD",
  "Блоки питания": "PSU",
};

export default function ListingTools({ l, sa, buyers = [] }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("edit");
  const [editState, editAction] = useFormState(updateListing, null);
  const [imgState, imgAction] = useFormState(addListingImage, null);

  // Основные поля
  const [title, setTitle] = useState(l.title || "");
  const [description, setDescription] = useState(l.description || "");
  const [price, setPrice] = useState(l.price ?? 0);
  const [category, setCategory] = useState(l.category || "");
  const [city, setCity] = useState(l.city || "Актау");
  const [district, setDistrict] = useState(l.district || "");

  // Одиночный компонент (для Видеокарты/Процессоры/RAM/MB/PSU)
  const [singleBrand, setSingleBrand] = useState(l.brand || "");
  const [singleModel, setSingleModel] = useState(l.modelPreset || "");

  // Компоненты готового ПК — инициализируем из l.components
  const initialPc = {
    GPU: { brand: "", model: "" },
    CPU: { brand: "", model: "" },
    RAM: { brand: "", model: "" },
    MOTHERBOARD: { brand: "", model: "" },
    PSU: { brand: "", model: "" },
  };
  if (Array.isArray(l.components)) {
    for (const c of l.components) {
      if (initialPc[c.type]) initialPc[c.type] = { brand: c.brand || "", model: c.model || "" };
    }
  }
  const [pcComponents, setPcComponents] = useState(initialPc);

  const singleComponentKey = CATEGORY_SINGLE_COMPONENT[category] || null;
  const isPcBuild = category === "Готовые ПК";

  const updatePc = (type, field, value) => {
    setPcComponents((prev) => {
      const next = { ...prev, [type]: { ...prev[type], [field]: value } };
      if (field === "brand") next[type].model = "";
      return next;
    });
  };

  if (!open) {
    return (
      <section className="card">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn w-full justify-center font-semibold"
        >
          ⚙️ Управление объявлением
        </button>
      </section>
    );
  }

  return (
    <section className="card space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h2 className="text-lg font-bold">⚙️ Управление объявлением</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-slate-400 hover:text-slate-100"
        >
          Свернуть
        </button>
      </div>

      {/* Табы */}
      <div className="flex flex-wrap gap-2">
        <TabBtn active={tab === "edit"} onClick={() => setTab("edit")}>Редактировать</TabBtn>
        <TabBtn active={tab === "tests"} onClick={() => setTab("tests")}>Тесты</TabBtn>
        <TabBtn active={tab === "media"} onClick={() => setTab("media")}>Фото</TabBtn>
        <TabBtn active={tab === "status"} onClick={() => setTab("status")}>Статус</TabBtn>
        {sa && (
          <TabBtn active={tab === "admin"} onClick={() => setTab("admin")}>Админ</TabBtn>
        )}
      </div>

      {/* ===== Редактирование ===== */}
      {tab === "edit" && (
        <form action={editAction} className="space-y-4">
          <input type="hidden" name="id" value={l.id} />

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Заголовок</label>
            <input
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="input"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Категория</label>
              <select
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input cursor-pointer"
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
                required
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Описание</label>
            <textarea
              name="description"
              required
              rows={5}
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input resize-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Город</label>
              <select
                name="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input cursor-pointer"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Район / Адрес</label>
              <input
                name="district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Одиночный компонент */}
          {singleComponentKey && (
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                  {COMPONENT_LABELS[singleComponentKey]}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Изменение бренда/модели используется в фильтрах.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Бренд</label>
                <select
                  name="brand"
                  required
                  value={singleBrand}
                  onChange={(e) => { setSingleBrand(e.target.value); setSingleModel(""); }}
                  className="input cursor-pointer"
                >
                  <option value="">—</option>
                  {Object.keys(PRESETS_BY_COMPONENT[singleComponentKey]).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Модель</label>
                <select
                  name="modelPreset"
                  required
                  value={singleModel}
                  onChange={(e) => setSingleModel(e.target.value)}
                  disabled={!singleBrand}
                  className="input cursor-pointer disabled:opacity-50"
                >
                  <option value="">—</option>
                  {singleBrand &&
                    PRESETS_BY_COMPONENT[singleComponentKey][singleBrand]?.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* Компоненты готового ПК */}
          {isPcBuild && (
            <div className="space-y-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                Комплектующие готового ПК
              </p>

              {PC_BUILD_COMPONENTS.map((type) => {
                const c = pcComponents[type];
                return (
                  <div
                    key={type}
                    className="grid grid-cols-1 gap-3 rounded-lg border border-white/10 bg-black/20 p-3 sm:grid-cols-3"
                  >
                    <div className="sm:col-span-3">
                      <p className="text-sm font-semibold text-slate-200">
                        {COMPONENT_LABELS[type]}
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-400">Бренд</label>
                      <select
                        name={`pc_${type}_brand`}
                        required
                        value={c.brand}
                        onChange={(e) => updatePc(type, "brand", e.target.value)}
                        className="input cursor-pointer text-sm"
                      >
                        <option value="">—</option>
                        {Object.keys(PRESETS_BY_COMPONENT[type]).map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-400">Модель</label>
                      <select
                        name={`pc_${type}_model`}
                        required
                        value={c.model}
                        onChange={(e) => updatePc(type, "model", e.target.value)}
                        disabled={!c.brand}
                        className="input cursor-pointer text-sm disabled:opacity-50"
                      >
                        <option value="">—</option>
                        {c.brand &&
                          PRESETS_BY_COMPONENT[type][c.brand]?.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                );
              })}

            </div>
          )}

          {editState?.error && (
            <p role="alert" className="rounded-lg border border-hot/40 bg-hot/10 p-2 text-sm text-hot">{editState.error}</p>
          )}
          {editState?.ok && (
            <p role="status" className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2 text-sm text-emerald-400">
              ✅ Изменения сохранены{editState.review ? " — объявление отправлено на повторную модерацию" : ""}.
            </p>
          )}

          <button type="submit" className="btn w-full font-semibold">
            Сохранить изменения
          </button>

          {l.status === "PUBLISHED" && (
            <p className="text-xs text-amber-500">
              ⚠️ После сохранения объявление вернётся на модерацию.
            </p>
          )}
        </form>
      )}

      {/* ===== Тесты ===== */}
      {tab === "tests" && (
        <div className="space-y-3">
          {(!l.tests || l.tests.length === 0) && (
            <p className="text-sm text-slate-400">Тестов пока нет.</p>
          )}

          {l.tests?.map((t) => (
            <div
              key={t.id}
              className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {COMPONENT_LABELS[t.componentType] || t.componentType}
                  </p>
                  <p className="text-xs text-slate-400">{t.testTitle}</p>
                  <p className="text-xs text-slate-500">
                    Результат: {t.resultStatus === "PASSED" ? "✅ пройден" : "❌ не пройден"}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {sa && (
                    <form action={setTestResult} className="flex items-center gap-1">
                      <input type="hidden" name="testId" value={t.id} />
                      <input
                        type="hidden"
                        name="result"
                        value={t.resultStatus === "PASSED" ? "FAILED" : "PASSED"}
                      />
                      <button className="text-xs text-cyan-400 hover:underline">
                        {t.resultStatus === "PASSED" ? "Пометить FAILED" : "Пометить PASSED"}
                      </button>
                    </form>
                  )}

                  <form action={deleteTest}>
                    <input type="hidden" name="testId" value={t.id} />
                    <button className="text-xs text-hot hover:underline">
                      Удалить тест
                    </button>
                  </form>
                </div>
              </div>

              {t.mediaUrls?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {t.mediaUrls.map((u) => (
                    <div key={u} className="relative">
                      <img
                        src={u}
                        alt=""
                        className="h-20 w-auto rounded-lg border border-white/10"
                      />
                      <form action={removeTestImage}>
                        <input type="hidden" name="testId" value={t.id} />
                        <input type="hidden" name="url" value={u} />
                        <button
                          type="submit"
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-hot text-xs text-white"
                          title="Удалить скриншот"
                        >
                          ×
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===== Фото ===== */}
      {tab === "media" && (
        <div className="space-y-3">
          <form action={imgAction} className="space-y-2">
            <input type="hidden" name="id" value={l.id} />
            <input
              type="file"
              name="photo"
              accept="image/*"
              required
              className="input text-sm"
            />
            <button type="submit" className="btn text-sm">Добавить фото</button>
            {imgState?.error && <p role="alert" className="text-sm text-hot">{imgState.error}</p>}
            {imgState?.ok && (
              <p role="status" className="text-sm text-emerald-400">
                ✅ Фото добавлено{imgState.review ? " — объявление отправлено на повторную модерацию" : ""}.
              </p>
            )}
            {l.status === "PUBLISHED" && (
              <p className="text-xs text-amber-500">⚠️ Добавление фото или тестов вернёт объявление на модерацию.</p>
            )}
          </form>

          {(!l.images || l.images.length === 0) && (
            <p className="text-sm text-slate-400">Фотографий пока нет.</p>
          )}

          {l.images?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {l.images.map((img) => (
                <div key={img.id} className="relative">
                  <img
                    src={img.url}
                    alt=""
                    className="h-24 w-auto rounded-lg border border-white/10"
                  />
                  <form action={removeListingImage}>
                    <input type="hidden" name="id" value={img.id} />
                    <button
                      type="submit"
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-hot text-xs text-white"
                      title="Удалить"
                    >
                      ×
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Статус ===== */}
      {tab === "status" && (
        <div className="space-y-3">
          {l.status === "NEEDS_EDIT" && (
            <form action={resubmitListing}>
              <input type="hidden" name="id" value={l.id} />
              <button className="btn w-full font-semibold">
                🔄 Отправить на повторную проверку
              </button>
            </form>
          )}

          {l.status === "HIDDEN" && (
            <form action={unhideListing}>
              <input type="hidden" name="id" value={l.id} />
              <button className="btn w-full font-semibold">
                👁 Показать объявление
              </button>
            </form>
          )}

          {l.status === "PUBLISHED" && (
            <>
              <form action={hideListings} className="space-y-2">
                <input type="hidden" name="ids" value={l.id} />
                <button className="btn w-full font-semibold">
                  🙈 Скрыть объявление
                </button>
              </form>

              <form action={markSold} className="space-y-2">
                <input type="hidden" name="id" value={l.id} />
                <label className="block text-xs font-medium text-slate-400">
                  Отметить как проданное
                </label>
                {buyers.length > 0 && (
                  <select name="buyerId" className="input cursor-pointer text-sm">
                    <option value="">— без покупателя —</option>
                    {buyers.map((b) => (
                      <option key={b.id} value={b.id}>{b.username}</option>
                    ))}
                  </select>
                )}
                <button className="btn w-full font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                  ✅ Пометить как проданное
                </button>
              </form>
            </>
          )}

          {l.status === "DELETED" && l.deletedReason !== "Удалено владельцем" && (
            <form action={appealListing} className="space-y-2">
              <input type="hidden" name="id" value={l.id} />
              <label className="block text-xs font-medium text-slate-400">
                Апелляция (опишите, что исправили)
              </label>
              <textarea
                name="message"
                rows={3}
                minLength={10}
                required
                className="input resize-none text-sm"
                placeholder="Опишите, что вы исправили..."
              />
              <button className="btn w-full font-semibold">
                📩 Отправить апелляцию
              </button>
            </form>
          )}

          {(l.status === "PUBLISHED" || l.status === "HIDDEN" || l.status === "DRAFT") && (
            <form
              action={deleteOwnListings}
              onSubmit={(e) => {
                if (!confirm("Удалить объявление?")) e.preventDefault();
              }}
            >
              <input type="hidden" name="ids" value={l.id} />
              <button className="btn w-full font-semibold bg-hot text-white hover:opacity-90">
                🗑 Удалить объявление
              </button>
            </form>
          )}
        </div>
      )}

      {/* ===== Админ ===== */}
      {tab === "admin" && sa && (
        <div className="space-y-3">
          <form action={approveListing}>
            <input type="hidden" name="id" value={l.id} />
            <button className="btn w-full font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400">
              ✅ Одобрить
            </button>
          </form>

          <form action={requestListingChanges} className="space-y-2">
            <input type="hidden" name="id" value={l.id} />
            <input
              name="note"
              placeholder="Причина (мин. 5 символов)"
              required
              minLength={5}
              className="input text-sm"
            />
            <button className="btn w-full font-semibold">
              ✏️ Требовать правок
            </button>
          </form>

          <form action={rejectListing} className="space-y-2">
            <input type="hidden" name="id" value={l.id} />
            <select name="reason" required className="input cursor-pointer text-sm">
              <option value="">Причина отклонения</option>
              <option value="1">Не соответствует проверкам</option>
              <option value="2">Неправильное оформление</option>
              <option value="3">Мошенничество</option>
            </select>
            <button className="btn w-full font-semibold bg-hot text-white hover:opacity-90">
              ❌ Отклонить
            </button>
          </form>

          <form
            action={deleteListing}
            onSubmit={(e) => {
              if (!confirm("Удалить объявление как админ?")) e.preventDefault();
            }}
            className="space-y-2"
          >
            <input type="hidden" name="id" value={l.id} />
            <select name="reason" required className="input cursor-pointer text-sm">
              <option value="">Причина удаления</option>
              <option value="1">Не соответствует проверкам</option>
              <option value="2">Неправильное оформление</option>
              <option value="3">Мошенничество</option>
            </select>
            <button className="btn w-full font-semibold bg-hot text-white hover:opacity-90">
              🗑 Удалить (админ)
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

function TabBtn({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-cyan-400 text-slate-950"
          : "bg-white/5 text-slate-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}