"use client";

import Link from "next/link";
import Image from "next/image";
import TrustBadge from "@/components/TrustBadge";
import { MapPin, ShieldCheck, Clock, Eye, Cpu } from "lucide-react";

export default function ListingCard({ listing }) {
  if (!listing) return null;

  // Безопасное извлечение данных из объекта listing
  const {
    id,
    title = "Без названия",
    price = 0,
    city = "Казахстан",
    district,
    category,
    images = [],
    createdAt,
    views = 0,
    testMetrics, // Если передаются данные о пройденных тестах
    hasTests = Boolean(testMetrics), 
    seller = {}
  } = listing;

  // Первая картинка из массива или заглушка
  const imageUrl = images[0]?.url || images[0] || null;

  // Форматирование даты
  const formattedDate = createdAt 
    ? new Date(createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
    : "Недавно";

  return (
    <Link
      href={`/listing/${id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300"
    >
      {/* 1. Блок изображения с эффектами и бейджами */}
      <div className="relative w-full aspect-[4/3] bg-slate-950 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-950/80 gap-2">
            <Cpu className="w-10 h-10 opacity-40" />
            <span className="text-xs font-medium opacity-60">Нет фото</span>
          </div>
        )}

        {/* Категория товара (Слева вверху) */}
        {category && (
          <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-slate-300 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-800/80 z-10">
            {category}
          </span>
        )}

        {/* Бейдж успешного стресс-теста (Справа вверху) */}
        {hasTests && (
          <span className="absolute top-3 right-3 bg-emerald-500/20 backdrop-blur-md text-emerald-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1 z-10 shadow-lg">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Тест пройден</span>
          </span>
        )}
      </div>

      {/* 2. Контентная часть карточки */}
      <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
        <div>
          {/* Цена товара */}
          <div className="text-xl font-extrabold text-cyan-400 tracking-tight mb-1">
            {price.toLocaleString("ru-RU")} ₸
          </div>

          {/* Четкий, контрастный заголовок */}
          <h3 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>
        </div>

        {/* Локация и дата публикации */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 truncate max-w-[170px]">
              <MapPin className="w-3.5 h-3.5 text-cyan-500/70 shrink-0" />
              <span className="truncate">{city}{district ? `, ${district}` : ""}</span>
            </span>

            <span className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
              <Clock className="w-3 h-3" />
              <span>{formattedDate}</span>
            </span>
          </div>
        </div>

        {/* Продавец, рейтинг доверия и счетчик просмотров */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 truncate pr-2">
            {/* Аватар продавца */}
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
              {seller?.username ? seller.username.charAt(0) : "P"}
            </div>

            {/* Имя продавца */}
            <span className="text-xs font-medium text-slate-300 truncate max-w-[100px]">
              {seller?.username || "Продавец"}
            </span>

            {/* Бейдж траста продавца */}
            {seller?.trustScore !== undefined && (
              <TrustBadge score={seller.trustScore} />
            )}
          </div>

          {/* Просмотры */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
            <Eye className="w-3 h-3" />
            <span>{views}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}