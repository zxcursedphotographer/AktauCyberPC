import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUser, mailOk } from "@/lib/auth";
import AutoRefresh from "@/components/AutoRefresh";
import { sendMessage } from "@/app/actions";
import TestTabs from "@/components/TestTabs";
import ListingTools from "@/components/ListingTools";
import TrustBadge from "@/components/TrustBadge";
import Avatar from "@/components/Avatar";
import SellerReviews from "@/components/SellerReviews";
import ListingGallery from "@/components/ListingGallery";

const get = (id) =>
  prisma.listing.findUnique({
    where: { id },
    include: { images: { orderBy: { order: "asc" } }, tests: true, user: true },
  });

export async function generateMetadata({ params }) {
  const l = await get(params.id);
  if (!l) return {};
  const title = `${l.title} — ${l.price.toLocaleString("ru")} ₸`;
  const description = `${l.city}, ${l.district}. ${l.description.slice(0, 120)}`;
  const images = l.images[0] ? [l.images[0].url] : [];
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: "website",
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/listing/${l.id}`,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function ListingPage({ params }) {
  const l = await get(params.id);
  if (!l) notFound();

  const me = await getUser();
  const own = me && me.id === l.userId;
  const sa = me && me.role === "SUPER_ADMIN";
  const canManage = own || sa;

  const isHidden = l.status === "DELETED" || l.status === "APPEAL";
  if (isHidden && !canManage) notFound();

  const buyers = canManage
    ? (
        await prisma.message.findMany({
          where: { listingId: l.id, receiverId: l.userId },
          distinct: ["senderId"],
          select: { sender: { select: { id: true, username: true } } },
        })
      ).map((m) => m.sender)
    : [];

  if (l.status !== "DELETED" && l.status !== "APPEAL") {
    prisma.listing
      .update({ where: { id: l.id }, data: { viewsCount: { increment: 1 } } })
      .catch(() => {});
  }

  let thread = [];
  if (me && me.id !== l.userId) {
    const where = { listingId: l.id, OR: [{ senderId: me.id }, { receiverId: me.id }] };
    thread = await prisma.message.findMany({ where, orderBy: { createdAt: "asc" } });
    await prisma.message.updateMany({
      where: { listingId: l.id, receiverId: me.id, isRead: false },
      data: { isRead: true },
    });
  }

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
      {l.status === "SOLD" && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-400 font-medium">
          ✅ Это объявление продано
        </div>
      )}
      {l.status === "DELETED" && (
        <div className="rounded-xl border border-hot/40 bg-hot/10 p-4 text-sm text-hot">
          <b>Это объявление удалено администрацией.</b>
          <p className="mt-1 opacity-90">Причина: {l.deletedReason || "не указана"}</p>
          {l.deletedAt && (
            <p className="mt-0.5 text-xs opacity-70">
              {new Date(l.deletedAt).toLocaleString("ru")}
            </p>
          )}
          {own && (
            <p className="mt-2 text-xs opacity-90">
              💡 Чтобы вернуть объявление, откройте{" "}
              <Link href={`/u/${me.username}?tab=deleted`} className="underline font-semibold">
                профиль → Удалённые
              </Link>{" "}
              и отправьте апелляцию.
            </p>
          )}
        </div>
      )}
      {l.status === "APPEAL" && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-400">
          <b>⏳ Апелляция отправлена и ожидает рассмотрения.</b>
          {l.appealMessage && (
            <p className="mt-1 text-xs opacity-90">Ваш комментарий: {l.appealMessage}</p>
          )}
          {l.appealAt && (
            <p className="mt-0.5 text-xs opacity-70">
              Отправлено: {new Date(l.appealAt).toLocaleString("ru")}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
          {/* Галерея — отдельный клиентский компонент с лайтбоксом */}
          <ListingGallery
            images={l.images.map((i) => i.url)}
            title={l.title}
            dimmed={isHidden || l.status === "SOLD"}
          />

          <div className="card space-y-4">
            <h1
              className={`text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-slate-50 leading-tight ${
                l.status === "SOLD" ? "line-through opacity-60" : ""
              }`}
            >
              {l.title}
            </h1>

            <div className="border-t border-slate-100 dark:border-white/5 pt-4">
              <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
                Описание
              </h2>
              <p className="text-sm lg:text-base whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed">
                {l.description || "Продавец не добавил описание."}
              </p>
            </div>
          </div>

          <TestTabs tests={JSON.parse(JSON.stringify(l.tests))} />

          {canManage && <ListingTools l={l} sa={sa} buyers={buyers} />}
        </div>

        <aside className="space-y-4 lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6">
          <div className="card space-y-4">
            <div>
              <p className="text-3xl lg:text-4xl font-black text-accent tracking-tight">
                {l.price.toLocaleString("ru")} ₸
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                📍 {l.city}
                {l.district ? `, ${l.district}` : ""} · {l.viewsCount} просмотров
              </p>
            </div>

            <hr className="border-slate-100 dark:border-white/10" />

            <Link
              href={`/u/${l.user.username}`}
              className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition duration-150 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar user={l.user} size={48} />
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-accent transition truncate">
                    {l.user.username}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    ★ {l.user.rating.toFixed(1)} / 10
                  </p>
                </div>
              </div>
              <TrustBadge score={l.user.trustScore} size={36} />
            </Link>

            {l.user.status === "UNDER_REVIEW" && (
              <p className="text-xs font-semibold text-amber-500 bg-amber-500/10 p-2 rounded-md text-center">
                ⚠️ Аккаунт проверяется модерацией
              </p>
            )}
          </div>

          {l.status !== "SOLD" && l.status !== "DELETED" && l.status !== "APPEAL" && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                  <span>Чат с продавцом</span>
                </h2>
                {me && me.id !== l.userId && (
                  <Link
                    href={`/chat?l=${l.id}&u=${l.userId}`}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    На весь экран
                  </Link>
                )}
              </div>

              {!me ? (
                <Link href="/login" className="btn w-full justify-center py-2.5">
                  Войдите, чтобы написать
                </Link>
              ) : me.id === l.userId ? (
                <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Это ваше объявление
                </div>
              ) : (
                <>
                  <div className="max-h-60 min-h-[100px] space-y-2 overflow-y-auto p-2 bg-slate-50 dark:bg-ink/50 rounded-lg text-xs">
                    {thread.length === 0 && (
                      <p className="text-slate-400 text-center py-6">
                        Спросите про состояние и место встречи.
                      </p>
                    )}
                    {thread.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.senderId === me.id ? "justify-end" : "justify-start"}`}
                      >
                        <p
                          className={`max-w-[85%] rounded-xl px-3 py-2 font-medium leading-normal ${
                            m.senderId === me.id
                              ? "bg-accent text-white rounded-br-none"
                              : "bg-slate-200 dark:bg-panel text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-300 dark:border-white/10"
                          }`}
                        >
                          {m.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {!mailOk(me) && (
                    <p className="text-xs text-amber-500 font-medium">
                      Подтвердите почту, чтобы писать продавцу.
                    </p>
                  )}

                  <form action={sendMessage} className="flex gap-2 pt-1">
                    <input type="hidden" name="listingId" value={l.id} />
                    <input type="hidden" name="receiverId" value={l.userId} />
                    <input
                      name="text"
                      required
                      maxLength={2000}
                      placeholder="Сообщение…"
                      className="input text-xs py-2"
                    />
                    <button className="btn text-xs px-4 shrink-0">Отправить</button>
                  </form>
                </>
              )}
            </div>
          )}

          {me && <AutoRefresh />}
          <SellerReviews sellerId={l.userId} />
        </aside>
      </div>
    </div>
  );
}