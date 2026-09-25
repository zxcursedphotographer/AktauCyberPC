import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { updateProfile, removeMedia, setTrust, addReview, updateUsername, resubmitListing } from "@/app/actions";
import TrustBadge from "@/components/TrustBadge";
import Avatar from "@/components/Avatar";
import ImageInput from "@/components/ImageInput";
import AppealModal from "@/components/AppealModal";
import ListingSelector from "@/components/ListingSelector";
import ListingCard from "@/components/ListingCard";
import {
  Package, ShoppingBag, Trash2, Star, MapPin, Calendar, Settings,
  Shield, Clock, EyeOff, AlertTriangle, Send,
} from "lucide-react";

const STATUS_INFO = {
  ACTIVE: { label: "Активен", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
  UNDER_REVIEW: { label: "На проверке", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  BANNED: { label: "Заблокирован", cls: "bg-hot/15 text-hot border-hot/30", dot: "bg-hot" },
};

function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <Icon size={26} />
      </div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      {subtitle && <p className="mt-1 max-w-xs text-sm opacity-60">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default async function Profile({ params, searchParams }) {
  const u = await prisma.user.findUnique({
    where: { username: decodeURIComponent(params.username) },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bannerUrl: true,
      bio: true,
      city: true,
      district: true,
      rating: true,
      trustScore: true,
      status: true,
      role: true,
      createdAt: true,
      _count: { select: { listings: true, reviewsGot: true } },
    },
  });
  if (!u) notFound();

  const me = await getUser();
  const sa = me?.role === "SUPER_ADMIN";
  const own = me?.id === u.id;
  const edit = own || sa;

  const [listings, reviews, canReview] = await Promise.all([
    prisma.listing.findMany({
      where: { userId: u.id },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        images: { take: 1, orderBy: { order: "asc" } },
      },
    }),
    prisma.review.findMany({
      where: { targetId: u.id },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 50,
      include: { author: { select: { username: true, avatarUrl: true } } },
    }),
    me && !own
      ? prisma.listing
          .count({ where: { userId: u.id, buyerId: me.id, status: "SOLD" } })
          .then((n) => sa || n > 0)
      : Promise.resolve(false),
  ]);

  // Разбивка по статусам
  const byStatus = {
    active: listings.filter((l) => l.status === "PUBLISHED" || l.status === "DRAFT"),
    review: listings.filter((l) => l.status === "UNDER_REVIEW"),
    needs_edit: listings.filter((l) => l.status === "NEEDS_EDIT"),
    sold: listings.filter((l) => l.status === "SOLD"),
    deleted: listings.filter((l) => l.status === "DELETED" || l.status === "APPEAL"),
    hidden: listings.filter((l) => l.status === "HIDDEN"),
  };

  const tabParam = searchParams.tab;
  const tab =
    tabParam === "review" ? "review"
    : tabParam === "needs_edit" ? "needs_edit"
    : tabParam === "sold" ? "sold"
    : tabParam === "deleted" ? "deleted"
    : tabParam === "hidden" ? "hidden"
    : "active";

  const shown = byStatus[tab] || byStatus.active;
  const status = STATUS_INFO[u.status] || STATUS_INFO.ACTIVE;

  const tabs = [
    { key: "active", label: "Активные", count: byStatus.active.length, icon: Package, href: `/u/${u.username}` },
    ...(edit ? [
      { key: "review", label: "На модерации", count: byStatus.review.length, icon: Clock, href: `/u/${u.username}?tab=review` },
      ...(byStatus.needs_edit.length > 0
        ? [{ key: "needs_edit", label: "Требует правок", count: byStatus.needs_edit.length, icon: AlertTriangle, href: `/u/${u.username}?tab=needs_edit` }]
        : []),
    ] : []),
    { key: "sold", label: "Проданные", count: byStatus.sold.length, icon: ShoppingBag, href: `/u/${u.username}?tab=sold` },
    ...(edit ? [
      { key: "hidden", label: "Скрытые", count: byStatus.hidden.length, icon: EyeOff, href: `/u/${u.username}?tab=hidden` },
      { key: "deleted", label: "Удалённые", count: byStatus.deleted.length, icon: Trash2, href: `/u/${u.username}?tab=deleted` },
    ] : []),
  ];

  const selectable = edit && (tab === "active" || tab === "hidden");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="relative h-40 overflow-hidden rounded-2xl bg-gradient-to-r from-accent to-hot md:h-56">
        {u.bannerUrl && <img src={u.bannerUrl} alt="" className="h-full w-full object-cover" />}
      </div>

      <div className="grid gap-6 px-4 md:grid-cols-[320px_1fr] md:px-0">
        <aside className="md:-mt-16">
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <div className="relative z-10 shrink-0 rounded-full border-4 border-slate-950 bg-slate-950 shadow-lg">
              <Avatar user={u} size={112} />
            </div>

            <h1 className="mt-3 text-2xl font-bold">{u.username}</h1>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm opacity-70 md:justify-start">
              {(u.city || u.district) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} />
                  {[u.city, u.district].filter(Boolean).join(", ")}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Star size={14} className="text-amber-400" />
                {u.rating.toFixed(1)}/10
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar size={14} />
                с {u.createdAt.toLocaleDateString("ru")}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <TrustBadge score={u.trustScore} size={40} label />
            </div>

            <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${status.cls}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              Статус: {status.label}
            </span>

            {edit && (
              <a
                href="#edit"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold transition hover:border-accent hover:bg-accent/10 hover:text-accent"
              >
                <Settings size={14} />
                Настройки профиля
              </a>
            )}
          </div>

          {u.bio && (
            <div className="card mt-4">
              <p className="text-sm leading-relaxed">{u.bio}</p>
            </div>
          )}

          {sa && (
            <form action={setTrust} className="card mt-4 space-y-2">
              <input type="hidden" name="id" value={u.id} />
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider opacity-60">
                <Shield size={12} /> Траст-фактор (только админ)
              </label>
              <div className="flex gap-2">
                <input name="score" type="number" min={1} max={100} defaultValue={u.trustScore} className="input !w-24" />
                <button className="btn flex-1">Задать</button>
              </div>
            </form>
          )}

          {edit && (
            <details id="edit" className="card mt-4">
              <summary className="cursor-pointer select-none font-semibold">Настройки профиля</summary>

              <form action={updateUsername} className="mt-4 space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider opacity-60">Сменить ник</label>
                <div className="flex gap-2">
                  <input name="username" defaultValue={u.username} placeholder="Новый ник" className="input flex-1" minLength={3} maxLength={20} required />
                  <button className="btn">Сменить</button>
                </div>
                <p className="text-[11px] opacity-50">Ник: 3–20 символов, только латиница, цифры и _</p>
              </form>

              <hr className="my-4 border-white/10" />

              <form action={updateProfile} className="space-y-3">
                <input type="hidden" name="id" value={u.id} />

                <label className="block text-xs font-semibold uppercase tracking-wider opacity-60">
                  Аватар (400×400, до 5 МБ — 1 фото)
                </label>
                <ImageInput name="avatar" className="input" single />

                <label className="block text-xs font-semibold uppercase tracking-wider opacity-60">
                  Баннер (1500×400, до 5 МБ — 1 фото)
                </label>
                <ImageInput name="banner" className="input" single />

                <label className="block text-xs font-semibold uppercase tracking-wider opacity-60">О себе</label>
                <textarea name="bio" defaultValue={u.bio || ""} rows={3} maxLength={500} placeholder="О себе" className="input resize-none" />

                <div className="grid gap-2 sm:grid-cols-2">
                  <input name="city" defaultValue={u.city || ""} placeholder="Город" className="input" />
                  <input name="district" defaultValue={u.district || ""} placeholder="Микрорайон" className="input" />
                </div>

                <button className="btn w-full justify-center">Сохранить изменения</button>
              </form>

              <form action={removeMedia} className="mt-3 flex gap-2">
                <input type="hidden" name="id" value={u.id} />
                <button name="field" value="avatarUrl" className="flex-1 rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10">Удалить аватар</button>
                <button name="field" value="bannerUrl" className="flex-1 rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10">Удалить баннер</button>
              </form>
            </details>
          )}
        </aside>

        <main className="min-w-0 space-y-6">
          <div className="flex gap-1 overflow-x-auto border-b border-white/10">
            {tabs.map((t) => {
              const active = tab === t.key;
              const Icon = t.icon;
              return (
                <Link
                  key={t.key}
                  href={t.href}
                  className={`relative flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-medium transition ${
                    active ? "text-accent" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Icon size={15} />
                  {t.label}
                  <span className={`rounded-full px-1.5 text-xs ${active ? "bg-accent/15 text-accent" : "bg-white/10"}`}>
                    {t.count}
                  </span>
                  {active && (
                    <span
                      className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full ${
                        t.key === "deleted" ? "bg-hot" : t.key === "needs_edit" ? "bg-orange-500" : "bg-accent"
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {shown.length === 0 ? (
            <EmptyState
              icon={
                tab === "sold" ? ShoppingBag
                : tab === "hidden" ? EyeOff
                : tab === "deleted" ? Trash2
                : tab === "review" ? Clock
                : tab === "needs_edit" ? AlertTriangle
                : Package
              }
              title={
                tab === "sold" ? "Проданных объявлений нет"
                : tab === "hidden" ? "Скрытых объявлений нет"
                : tab === "deleted" ? "Удалённых объявлений нет"
                : tab === "review" ? "Объявлений на модерации нет"
                : tab === "needs_edit" ? "Объявлений на правках нет"
                : "Активных объявлений нет"
              }
              subtitle={
                tab === "active" && own
                  ? "Разместите первое объявление — покупатели увидят вас в поиске."
                  : tab === "review"
                    ? "Как только админ одобрит — объявления появятся в активных."
                    : tab === "hidden"
                      ? "Скрытые объявления не видны другим — вы можете вернуть их в любой момент."
                      : undefined
              }
              action={
                tab === "active" && own ? <Link href="/new" className="btn">+ Создать объявление</Link> : null
              }
            />
          ) : (
            <ListingSelector
              items={shown.map((l) => ({ id: l.id }))}
              mode={tab === "hidden" ? "hidden" : "active"}
              selectable={selectable}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map((l) => {
                  const isDeleted = l.status === "DELETED";
                  const isAppeal = l.status === "APPEAL";
                  const isHidden = l.status === "HIDDEN";
                  const isReview = l.status === "UNDER_REVIEW";
                  const isNeedsEdit = l.status === "NEEDS_EDIT";

                  return (
                    <ListingCard key={l.id} listing={{ id: l.id }}>
                      {l.status === "SOLD" && (
                        <span className="absolute left-2 top-2 z-10 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white shadow-lg">
                          ПРОДАНО
                        </span>
                      )}
                      {isDeleted && (
                        <span className="absolute left-2 top-2 z-10 rounded-full bg-hot px-2 py-0.5 text-xs font-bold text-white shadow-lg">
                          УДАЛЕНО
                        </span>
                      )}
                      {isAppeal && (
                        <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white shadow-lg">
                          <Clock size={10} /> НА АПЕЛЛЯЦИИ
                        </span>
                      )}
                      {isHidden && (
                        <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-slate-600 px-2 py-0.5 text-xs font-bold text-white shadow-lg">
                          <EyeOff size={10} /> СКРЫТО
                        </span>
                      )}
                      {isReview && (
                        <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white shadow-lg">
                          <Clock size={10} /> НА МОДЕРАЦИИ
                        </span>
                      )}
                      {isNeedsEdit && (
                        <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white shadow-lg">
                          <AlertTriangle size={10} /> ТРЕБУЕТ ПРАВОК
                        </span>
                      )}

                      {isDeleted || isAppeal ? (
                        <div className="flex flex-1 flex-col p-3">
                          {l.images[0] && (
                            <img
                              src={l.images[0].url}
                              alt=""
                              className={`mb-3 h-40 w-full rounded-lg object-cover ${isAppeal ? "opacity-60" : "opacity-40 grayscale"}`}
                            />
                          )}
                          <b className="opacity-80">{l.title}</b>
                          <p className="text-sm text-accent opacity-80">{l.price.toLocaleString("ru")} ₸</p>

                          <div className="mt-2 rounded-lg border border-hot/40 bg-hot/10 p-2 text-xs">
                            <b className="block text-hot">
                              {isAppeal ? "Отправлена апелляция" : "Удалено администрацией"}
                            </b>
                            <span className="opacity-90">
                              Причина: {l.previousReason || l.deletedReason || "не указана"}
                            </span>
                            {(isAppeal ? l.appealAt : l.deletedAt) && (
                              <span className="block opacity-60">
                                {new Date(isAppeal ? l.appealAt : l.deletedAt).toLocaleString("ru")}
                              </span>
                            )}
                          </div>

                          {isAppeal && l.appealMessage && (
                            <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
                              <b className="block text-amber-400">Ваш комментарий:</b>
                              <span className="opacity-90">{l.appealMessage}</span>
                            </div>
                          )}

                          {own && isDeleted && l.deletedReason !== "Удалено владельцем" && (
                            <div className="mt-auto pt-3">
                              <AppealModal
                                listing={{
                                  id: l.id,
                                  title: l.title,
                                  description: l.description,
                                  price: l.price,
                                  deletedReason: l.deletedReason,
                                  deletedAt: l.deletedAt?.toISOString?.() || l.deletedAt,
                                }}
                              />
                            </div>
                          )}
                          {isAppeal && (
                            <div className="mt-auto pt-3 text-center text-xs text-amber-400">
                              ⏳ Ожидает проверки администратора
                            </div>
                          )}
                        </div>
                      ) : isReview ? (
                        <div className="flex flex-1 flex-col p-3">
                          {l.images[0] && (
                            <img src={l.images[0].url} alt="" className="mb-3 h-40 w-full rounded-lg object-cover opacity-70" />
                          )}
                          <b className="opacity-90">{l.title}</b>
                          <p className="text-sm text-accent opacity-90">{l.price.toLocaleString("ru")} ₸</p>
                          <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
                            <b className="block text-amber-400">⏳ Объявление на модерации</b>
                            <span className="opacity-80">Обычно проверка занимает до 24 часов</span>
                          </div>
                          <div className="mt-auto pt-3">
                            <Link href={`/listing/${l.id}`} className="text-xs text-accent underline">
                              Открыть объявление
                            </Link>
                          </div>
                        </div>
                      ) : isNeedsEdit ? (
                        <div className="flex flex-1 flex-col p-3">
                          {l.images[0] && (
                            <img src={l.images[0].url} alt="" className="mb-3 h-40 w-full rounded-lg object-cover opacity-70" />
                          )}
                          <b className="opacity-90">{l.title}</b>
                          <p className="text-sm text-accent opacity-90">{l.price.toLocaleString("ru")} ₸</p>

                          <div className="mt-2 rounded-lg border border-orange-500/40 bg-orange-500/10 p-2 text-xs">
                            <b className="block text-orange-400">⚠️ Требует правок</b>
                            {l.moderationNote && <span className="mt-1 block opacity-90">{l.moderationNote}</span>}
                          </div>

                          <div className="mt-auto flex flex-col gap-2 pt-3">
                            <Link href={`/listing/${l.id}`} className="btn w-full justify-center py-1.5 text-xs">
                              Исправить
                            </Link>
                            <form action={resubmitListing}>
                              <input type="hidden" name="id" value={l.id} />
                              <button className="w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20">
                                <Send size={12} className="mr-1 inline" /> Отправить на проверку
                              </button>
                            </form>
                          </div>
                        </div>
                      ) : (
                        <Link href={`/listing/${l.id}`} className="block">
                          {l.images[0] ? (
                            <img
                              src={l.images[0].url}
                              alt=""
                              className={`h-40 w-full object-cover transition group-hover:scale-[1.02] ${isHidden ? "opacity-50 grayscale" : ""}`}
                            />
                          ) : (
                            <div className="flex h-40 items-center justify-center bg-white/5 text-4xl opacity-30">📦</div>
                          )}
                          <div className="p-3">
                            <b className="line-clamp-1">{l.title}</b>
                            <p className="mt-1 text-accent">{l.price.toLocaleString("ru")} ₸</p>
                          </div>
                        </Link>
                      )}
                    </ListingCard>
                  );
                })}
              </div>
            </ListingSelector>
          )}

          <section id="reviews">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <Star size={18} className="text-amber-400" />
              Отзывы
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-normal opacity-70">
                {u._count.reviewsGot}
              </span>
            </h2>

            {me && !own && !canReview && (
              <p className="mb-3 rounded-xl bg-white/5 p-3 text-sm opacity-70">
                Оставить отзыв можно после сделки: продавец отмечает объявление проданным и выбирает вас покупателем.
              </p>
            )}

            {canReview && (
              <form action={addReview} className="card mb-3 flex flex-wrap gap-2">
                <input type="hidden" name="id" value={u.id} />
                <select name="rating" className="input !w-28">
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n} / 10</option>
                  ))}
                </select>
                <input name="text" required maxLength={500} placeholder="Ваш отзыв" className="input flex-1" />
                <button className="btn">Оставить отзыв</button>
              </form>
            )}

            {reviews.length === 0 ? (
              <EmptyState
                icon={Star}
                title="Отзывов пока нет"
                subtitle={own ? "Отзывы появятся после завершения сделок." : "Станьте первым, кто оставит отзыв."}
              />
            ) : (
              <div className="space-y-2">
                {reviews.map((r) => (
                  <div key={r.id} className={`card flex gap-3 text-sm ${r.pinned ? "!border-accent/60" : ""}`}>
                    <Avatar user={r.author} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <b>{r.author.username}</b>
                        <span className="inline-flex items-center gap-1 text-amber-400">
                          <Star size={12} /> {r.rating}/10
                        </span>
                        {r.pinned && (
                          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-slate-950">
                            ВЛАДЕЛЕЦ ПЛАТФОРМЫ
                          </span>
                        )}
                      </div>
                      <p className="mt-1 leading-relaxed opacity-90">{r.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}