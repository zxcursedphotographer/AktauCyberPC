"use client";

import { useListingSelector } from "@/components/ListingSelector";

export default function ListingCard({ listing, children }) {
  const { selectMode, selected, toggle } = useListingSelector();
  const isSelected = selected.has(listing.id);

  const handleClick = (e) => {
    if (selectMode) {
      e.preventDefault();
      e.stopPropagation();
      toggle(listing.id);
    }
  };

  return (
    <div
      onClickCapture={handleClick}
      className={`group card relative flex flex-col overflow-hidden !p-0 ${
        isSelected ? "!border-accent ring-2 ring-accent/40" : ""
      }`}
    >
      {selectMode && (
        <span
          className={`pointer-events-none absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/60 backdrop-blur-sm transition ${
            isSelected ? "bg-accent" : "bg-black/60"
          }`}
        >
          {isSelected ? (
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          ) : (
            <span className="h-2 w-2 rounded-full bg-white/30" />
          )}
        </span>
      )}
      {children}
    </div>
  );
}