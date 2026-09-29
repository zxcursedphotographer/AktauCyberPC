"use client";

import { useState, useMemo } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import ImageInput from "@/components/ImageInput";
import ComponentPicker from "@/components/ComponentPicker";
import {
  GPU_PRESETS,
  CPU_PRESETS,
  RAM_PRESETS,
  MOTHERBOARD_PRESETS,
  PSU_PRESETS,
  COMPONENT_LABELS,
  PC_BUILD_COMPONENTS,
} from "@/lib/constants";

const CATEGORY_SINGLE_COMPONENT = {
  "Видеокарты": "GPU",
  "Процессоры": "CPU",
  "Оперативная память": "RAM",
  "Материнские платы": "MOTHERBOARD",
  "Блоки питания": "PSU",
};

const PRESETS_BY_COMPONENT = {
  GPU: GPU_PRESETS,
  CPU: CPU_PRESETS,
  RAM: RAM_PRESETS,
  MOTHERBOARD: MOTHERBOARD_PRESETS,
  PSU: PSU_PRESETS,
};

const PICKER_CATEGORIES = ["Видеокарты", "Процессоры"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn flex-1 py-3.5 text-center disabled:opacity-60">
      {pending ? "Публикуем… это может занять до минуты" : "Опубликовать"}
    </button>
  );
}

export default function NewListingFormClient({
  action,
  cats = [],
  types = [],
  cities = [],
  defaultCity,
  defaultDistrict,
}) {
  const [state, formAction] = useFormState(action, null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Одиночный компонент — выбранная строка "Brand Model"
  const [singlePick, setSinglePick] = useState("");

  // Старые селекты (RAM/MB/PSU)
  const [singleBrand, setSingleBrand] = useState("");
  const [singleModel, setSingleModel] = useState("");

  // Компоненты готового ПК
  const [pcComponents, setPcComponents] = useState({
    GPU: { brand: "", model: "" },
    CPU: { brand: "", model: "" },
    RAM: { brand: "", model: "" },
    MOTHERBOARD: { brand: "", model: "" },
    PSU: { brand: "", model: "" },
  });

  const singleComponentKey = useMemo(
    () => CATEGORY_SINGLE_COMPONENT[selectedCategory] || null,
    [selectedCategory]
  );

  const isPcBuild = selectedCategory === "Готовые ПК";
  const usePicker = PICKER_CATEGORIES.includes(selectedCategory);

  const parsedPick = useMemo(() => {
    if (!singlePick || !singleComponentKey) return { brand: "", model: "" };
    const presets = PRESETS_BY_COMPONENT[singleComponentKey];
    for (const brand of Object.keys(presets)) {
      const model = presets[brand].find((m) => `${brand} ${m}` === singlePick);
      if (model) return { brand, model };
    }
    return { brand: "", model: "" };
  }, [singlePick, singleComponentKey]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setSinglePick("");
    setSingleBrand("");
    setSingleModel("");
    setErrorMessage("");
  };

  const updatePcComponent = (type, field, value) => {
    setPcComponents((prev) => {
      const next = { ...prev, [type]: { ...prev[type], [field]: value } };
      if (field === "brand") next[type].model = "";
      return next;
    });
  };

  const handleSubmit = (e) => {
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const cat = selectedCategory.toLowerCase();

    const getFilesCount = (key) => {
      const files = formData.getAll(key);
      return files.filter((f) => f && f.size > 0).length;
    };

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

    if (singleComponentKey) {
      if (usePicker) {
        if (!parsedPick.brand || !parsedPick.model) {
          e.preventDefault();
          setErrorMessage(
            `⚠️ Выберите ${COMPONENT_LABELS[singleComponentKey].toLowerCase()} из списка.`
          );
          return;
        }
      } else {
        if (!singleBrand || !singleModel) {
          e.preventDefault();
          setErrorMessage(
            `⚠️ Выберите ${COMPONENT_LABELS[singleComponentKey].toLowerCase()} (бренд и модель).`
          );
          return;
        }
      }
    }

    if (isPcBuild) {
      for (const type of PC_BUILD_COMPONENTS) {
        const c = pcComponents[type];
        if (!c.brand || !c.model) {
          e.preventDefault();
          setErrorMessage(`⚠️ Для готового ПК выберите: ${COMPONENT_LABELS[type]}.`);
          return;
        }
      }
    }

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
    <form action={formAction} onSubmit={handleSubmit} className="w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Новое объявление</h1>
        <p className="mt-1 text-sm text-slate-400">
          Разместите видеокарту, ПК или комплектующие на AktauCyberPC
        </p>
      </div>

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
              onChange={handleCategoryChange}
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
              min={1}
              max={2000000000}
              placeholder="150000"
              className="input"
            />
          </div>
        </div>

        {/* Одиночный выбор компонента */}
        {singleComponentKey && (
          <div className="space-y-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                {COMPONENT_LABELS[singleComponentKey]}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Выберите точную модель из списка — она будет использоваться в фильтрах.
              </p>
            </div>

            {usePicker ? (
              <>
                <ComponentPicker
                  presets={PRESETS_BY_COMPONENT[singleComponentKey]}
                  value={singlePick}
                  onChange={setSinglePick}
                  placeholder={`Например: ${singleComponentKey === "GPU" ? "NVIDIA RTX 3070" : "AMD Ryzen 5 5600X"}`}
                />
                {/* Скрытые поля для отправки на сервер */}
                <input type="hidden" name="brand" value={parsedPick.brand} />
                <input type="hidden" name="modelPreset" value={parsedPick.model} />
              </>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Бренд *</label>
                  <select
                    name="brand"
                    required
                    value={singleBrand}
                    onChange={(e) => { setSingleBrand(e.target.value); setSingleModel(""); }}
                    className="input cursor-pointer"
                  >
                    <option value="">Выберите бренд</option>
                    {Object.keys(PRESETS_BY_COMPONENT[singleComponentKey]).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Модель *</label>
                  <select
                    name="modelPreset"
                    required
                    value={singleModel}
                    onChange={(e) => setSingleModel(e.target.value)}
                    disabled={!singleBrand}
                    className="input cursor-pointer disabled:opacity-50"
                  >
                    <option value="">{singleBrand ? "Выберите модель" : "Сначала бренд"}</option>
                    {singleBrand &&
                      PRESETS_BY_COMPONENT[singleComponentKey][singleBrand]?.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Готовый ПК */}
        {isPcBuild && (
          <div className="space-y-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                Комплектация готового ПК
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Выберите каждый компонент из списка. Это позволит покупателям искать сборки по железу.
              </p>
            </div>

            {PC_BUILD_COMPONENTS.map((type) => {
              const presets = PRESETS_BY_COMPONENT[type];
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
                    <label className="mb-1 block text-xs font-medium text-slate-400">Бренд *</label>
                    <select
                      name={`pc_${type}_brand`}
                      required
                      value={c.brand}
                      onChange={(e) => updatePcComponent(type, "brand", e.target.value)}
                      className="input cursor-pointer text-sm"
                    >
                      <option value="">Выберите бренд</option>
                      {Object.keys(presets).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-400">Модель *</label>
                    <select
                      name={`pc_${type}_model`}
                      required
                      value={c.model}
                      onChange={(e) => updatePcComponent(type, "model", e.target.value)}
                      disabled={!c.brand}
                      className="input cursor-pointer text-sm disabled:opacity-50"
                    >
                      <option value="">{c.brand ? "Выберите модель" : "Сначала бренд"}</option>
                      {c.brand &&
                        presets[c.brand]?.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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

      {/* Блок тестов — без изменений */}
      <div className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Проверенные компоненты</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Прикрепите результаты стресс-тестов для повышения доверия покупателей. Итог проверки (пройден / не пройден) ставит модератор.
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

      {(errorMessage || state?.error) && (
        <div role="alert" className="rounded-xl border border-hot/30 bg-hot/10 p-4 text-sm font-medium text-hot">
          {errorMessage || state.error}
        </div>
      )}

      <div className="flex gap-4 pt-2">
        <SubmitButton />
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