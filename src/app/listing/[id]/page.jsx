import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUser, mailOk } from "@/lib/auth";
import AutoRefresh from "@/components/AutoRefresh";
import TestTabs from "@/components/TestTabs";
import ListingTools from "@/components/ListingTools";
import TrustBadge from "@/components/TrustBadge";
import Avatar from "@/components/Avatar";
import SellerReviews from "@/components/SellerReviews";
import ListingGallery from "@/components/ListingGallery";
import ChatForm from "@/components/ChatForm";

const get = (id) =>
  prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      tests: true,
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          rating: true,
          trustScore: true,
          status: true,
        },
      },
    },
  });

export async function generateMetadata({ params }) {
  const l = await get(params.id);
  if (!l) return {};
  const title = `${l.title} — ${l.price.toLocaleString("ru")} ₸`;
  const description = `${l.city}${l.district ? `, ${l.district}` : ""}. ${l.description.slice(0, 120)}`;
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

function formatTime(date) {
  return new Date(date).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

export default async function ListingPage({ params }) {
  const l = await get(params.id);
  if (!l) notFound();

  const me = await getUser();
  const own = me?.id === l.userId;
  const sa = me?.role === "SUPER_ADMIN";
  const canManage = own || sa;

  const isHidden = l.status === "DELETED" || l.status === "APPEAL";
  if (isHidden && !canManage) notFound();

  // Загружаем всё параллельно
  const [buyers, thread] = await Promise.all([
    canManage
      ? prisma.message
          .findMany({
            where: { listingId: l.id, receiverId: l.userId },
            distinct: ["senderId"],
            select: { sender: { select: { id: true, username: true } } },
          })
          .then((msgs) => msgs.map((m) => m.sender))
      : Promise.resolve([]),
    me && me.id !== l.userId
      ? prisma.message.findMany({
          where: { listingId: l.id, OR: [{ senderId: me.id }, { receiverId: me.id }] },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  // Инкремент просмотров + отметка прочтения — fire and forget
  if (!isHidden) {
    prisma.listing.update({ where: { id: l.id }, data: { viewsCount: { increment: 1 } } }).catch(() => {});
  }
  if (me && me.id !== l.userId) {
    prisma.message
      .updateMany({
        where: { listingId: l.id, receiverId: me.id, isRead: false },
        data: { isRead: true },
      })
      .catch(() => {});
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8">
      {l.status === "SOLD" && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400">
          ✅ Это объявление продано
        </div>
      )}

      {l.status === "DELETED" && (
        <div className="rounded-xl border border-hot/40 bg-hot/10 p-4 text-sm text-hot">
          <b>Это объявление удалено администрацией.</b>
          <p className="mt-1 opacity-90">Причина: {l.deletedReason || "не указана"}</p>
          {l.deletedAt && (
            <p className="mt-0.5 text-xs opacity-70">{new Date(l.deletedAt).toLocaleString("ru")}</p>
          )}
          {own && l.deletedReason !== "Удалено владельцем" && (
            <p className="mt-2 text-xs opacity-90">
              💡 Чтобы вернуть объявление, откройте{" "}
              <Link href={`/u/${me.username}?tab=deleted`} className="underline">
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
          {l.appealMessage && <p className="mt-1 text-xs opacity-90">Ваш комментарий: {l.appealMessage}</p>}
          {l.appealAt && (
            <p className="mt-0.5 text-xs opacity-70">
              Отправлено: {new Date(l.appealAt).toLocaleString("ru")}
            </p>
          )}
        </div>
      )}

      {l.status === "UNDER_REVIEW" && own && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-400">
          <b>⏳ Объявление на модерации.</b>
          <p className="mt-1 text-xs opacity-80">После одобрения администратором оно появится в общем поиске.</p>
        </div>
      )}

      {l.status === "NEEDS_EDIT" && own && (
        <div className="rounded-xl border border-orange-500/40 bg-orange-500/10 p-4 text-sm text-orange-400">
          <b>⚠️ Требует правок</b>
          {l.moderationNote && <p className="mt-1 opacity-90">Причина: {l.moderationNote}</p>}
          <p className="mt-1 text-xs opacity-80">Откройте «Управление объявлением» ниже и нажмите «Отправить на проверку».</p>
        </div>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
          <ListingGallery
            images={l.images.map((i) => i.url)}
            title={l.title}
            dimmed={isHidden || l.status === "SOLD"}
          />

          <div className="card space-y-4">
            <h1
              className={`text-2xl font-extrabold leading-tight lg:text-3xl ${
                l.status === "SOLD" ? "line-through opacity-60" : ""
              }`}
            >
              {l.title}
            </h1>

            <div className="border-t border-white/5 pt-4">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Описание</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300 lg:text-base">
                {l.description || "Продавец не добавил описание."}
              </p>
            </div>
          </div>

          <TestTabs tests={JSON.parse(JSON.stringify(l.tests))} />

          {canManage && <ListingTools l={JSON.parse(JSON.stringify(l))} sa={sa} buyers={buyers} />}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:col-span-5 xl:col-span-4">
          <div className="card space-y-4">
            <div>
              <p className="text-3xl font-black tracking-tight text-accent lg:text-4xl">
                {l.price.toLocaleString("ru")} ₸
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                📍 {l.city}
                {l.district ? `, ${l.district}` : ""} · {l.viewsCount} просмотров
              </p>
            </div>

            <hr className="border-white/10" />

            <Link
              href={`/u/${l.user.username}`}
              className="group -mx-2 flex items-center justify-between rounded-lg p-2 transition hover:bg-white/5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar user={l.user} size={48} />
                <div className="min-w-0">
                  <p className="truncate font-bold transition group-hover:text-accent">{l.user.username}</p>
                  <p className="text-xs font-medium text-slate-500">★ {l.user.rating.toFixed(1)} / 10</p>
                </div>
              </div>
              <TrustBadge score={l.user.trustScore} size={36} />
            </Link>

            {l.user.status === "UNDER_REVIEW" && (
              <p className="rounded-md bg-amber-500/10 p-2 text-center text-xs font-semibold text-amber-500">
                ⚠️ Аккаунт проверяется модерацией
              </p>
            )}
          </div>

          {l.status !== "SOLD" && l.status !== "DELETED" && l.status !== "APPEAL" && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">Чат с продавцом</h2>
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
                <div className="rounded-lg bg-white/5 p-3 text-center text-xs font-medium text-slate-400">
                  Это ваше объявление
                </div>
              ) : (
                <>
                  <div className="max-h-64 min-h-[100px] space-y-2 overflow-y-auto rounded-lg bg-black/20 p-2 text-xs">
                    {thread.length === 0 && (
                      <p className="py-6 text-center text-slate-400">
                        Спросите про состояние и место встречи.
                      </p>
                    )}
                    {thread.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${m.senderId === me.id ? "items-end" : "items-start"}`}
                      >
                        <p
                          className={`max-w-[85%] rounded-xl px-3 py-2 font-medium leading-normal ${
                            m.senderId === me.id
                              ? "rounded-br-none bg-accent font-bold text-slate-950"
                              : "rounded-bl-none border border-white/10 bg-panel"
                          }`}
                        >
                          {m.text}
                        </p>
                        <span className="mt-0.5 px-1 text-[10px] opacity-60">
                          {formatTime(m.createdAt)}
                          {m.senderId === me.id && (m.isRead ? " · ✓✓" : " · ✓")}
                        </span>
                      </div>
                    ))}
                  </div>

                  {!mailOk(me) && (
                    <p className="text-xs font-medium text-amber-500">
                      Подтвердите почту, чтобы писать продавцу.
                    </p>
                  )}

                  <ChatForm listingId={l.id} receiverId={l.userId} />
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