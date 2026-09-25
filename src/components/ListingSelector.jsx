"use client";

import { createContext, useContext, useState } from "react";
import { CheckSquare, Square } from "lucide-react";
import ListingBulkActions from "@/components/ListingBulkActions";

const SelectorContext = createContext(null);

export function useListingSelector() {
  const ctx = useContext(SelectorContext);
  if (!ctx) {
    // Возвращаем безопасный default, если компонент вне Provider
    return { selectMode: false, selected: new Set(), toggle: () => {} };
  }
  return ctx;
}

export function ListingSelector({
  items,
  mode = "active",
  selectable = true,
  children,
}) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((l) => l.id)));
  };

  const clear = () => {
    setSelected(new Set());
    setSelectMode(false);
  };

  return (
    <SelectorContext.Provider value={{ selectMode, selected, toggle }}>
      {selectable && items.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="text-sm opacity-70">
            {selectMode
              ? `Выбрано ${selected.size} из ${items.length}`
              : `Всего: ${items.length}`}
          </div>
          <div className="flex gap-2">
            {selectMode && (
              <button
                onClick={selectAll}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
              >
                {selected.size === items.length ? "Снять все" : "Выбрать все"}
              </button>
            )}
            <button
              onClick={() => {
                setSelectMode(!selectMode);
                setSelected(new Set());
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                selectMode
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-white/20 hover:bg-white/10"
              }`}
            >
              {selectMode ? <CheckSquare size={14} /> : <Square size={14} />}
              {selectMode ? "Готово" : "Выбрать"}
            </button>
          </div>
        </div>
      )}

      {children}

      {selectMode && selected.size > 0 && (
        <ListingBulkActions
          selectedIds={[...selected]}
          mode={mode}
          onClear={clear}
        />
      )}
    </SelectorContext.Provider>
  );
}
export default ListingSelector;