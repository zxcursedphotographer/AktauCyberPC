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

const get = (id) => prisma.listing.findUnique({
  where: { id },
  include: { images: { orderBy: { order: "asc" } }, tests: true, user: true },
});

export async function generateMetadata({ params }) {
  const l = await get(params.id); if (!l) return {};
  const title = `${l.title} — ${l.price.toLocaleString("ru")} ₸`;
  const description = `${l.city}, ${l.district}. ${l.description.slice(0, 120)}`;
  const images = l.images[0] ? [l.images[0].url] : [];
  return {
    title,
    description,
    openGraph: { title, description, images, type: "website", url: `${process.env.NEXT_PUBLIC_SITE_URL}/listing/${l.id}` },
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

  // Удалённое или на апелляции объявление — видно только владельцу и админу
  const isHidden = l.status === "DELETED" || l.status === "APPEAL";
  if (isHidden && !canManage) notFound();

  const buyers = canManage
    ? (await prisma.message.findMany({
        where: { listingId: l.id, receiverId: l.userId },
        distinct: ["senderId"],
        select: { sender: { select: { id: true, username: true } } },
      })).map((m) => m.sender)
    : [];

  if (l.status !== "DELETED" && l.status !== "APPEAL") {
    prisma.listing.update({ where: { id: l.id }, data: { viewsCount: { increment: 1 } } }).catch(() => {});
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
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {/* Плашки статусов для владельца/админа */}
        {l.status === "SOLD" && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-400">
            ✅ Это объявление продано
          </div>
        )}
        {l.status === "DELETED" && (
          <div className="rounded-xl border border-hot/40 bg-hot/10 p-3 text-sm text-hot">
            <b>Это объявление удалено администрацией.</b>
            <p className="mt-1 opacity-90">Причина: {l.deletedReason || "не указана"}</p>
            {l.deletedAt && (
              <p className="mt-0.5 text-xs opacity-70">
                {new Date(l.deletedAt).toLocaleString("ru")}
              </p>
            )}
            {own && (
              <p className="mt-2 text-xs opacity-90">
                💡 Чтобы вернуть объявление, откройте <Link href={`/u/${me.username}?tab=deleted`} className="underline">профиль → Удалённые</Link> и отправьте апелляцию.
              </p>
            )}
          </div>
        )}
        {l.status === "APPEAL" && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-400">
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

        <div className="flex snap-x gap-2 overflow-x-auto">
          {l.images.map((i) => (
            <img
              key={i.id}
              src={i.url}
              alt={l.title}
              className={`h-72 snap-center rounded-xl object-cover ${
                l.status === "SOLD" || l.status === "DELETED" || l.status === "APPEAL" ? "opacity-70" : ""
              }`}
            />
          ))}
        </div>

        <h1 className={`text-2xl font-bold ${l.status === "SOLD" ? "line-through opacity-60" : ""}`}>
          {l.title}
        </h1>
        <p className="opacity-80">{l.description}</p>
        <TestTabs tests={JSON.parse(JSON.stringify(l.tests))} />
        {canManage && <ListingTools l={l} sa={sa} buyers={buyers} />}
      </div>

      <aside className="space-y-4">
        <div className="card">
          <p className="text-3xl font-bold text-accent">{l.price.toLocaleString("ru")} ₸</p>
          <p className="text-sm opacity-70">
            {l.city}, {l.district} · {l.viewsCount} просмотров
          </p>
          <hr className="my-3 border-white/10" />
          <Link href={`/u/${l.user.username}`} className="flex items-center gap-3 font-semibold hover:underline">
            <Avatar user={l.user} size={44} />
            <span>
              {l.user.username}
              <br />
              <span className="text-xs font-normal opacity-70">★ {l.user.rating.toFixed(1)}/10</span>
            </span>
            <TrustBadge score={l.user.trustScore} size={40} />
          </Link>
          {l.user.status === "UNDER_REVIEW" && (
            <p className="mt-1 text-xs text-amber-500">Аккаунт проверяется модерацией</p>
          )}
        </div>

        {/* Чат — только если объявление активно */}
        {l.status !== "SOLD" && l.status !== "DELETED" && l.status !== "APPEAL" && (
          <div className="card">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                Чат с <Avatar user={l.user} size={24} />
                {l.user.username}
              </h2>
              {me && me.id !== l.userId && (
                <Link href={`/chat?l=${l.id}&u=${l.userId}`} className="text-xs underline">
                  На весь экран
                </Link>
              )}
            </div>
            {!me ? (
              <Link href="/login" className="btn">Войдите, чтобы написать</Link>
            ) : me.id === l.userId ? (
              <p className="text-sm opacity-70">Это ваше объявление.</p>
            ) : (
              <>
                <div className="mb-2 max-h-64 space-y-1 overflow-y-auto text-sm">
                  {thread.length === 0 && <p className="opacity-60">Спросите про состояние и место встречи.</p>}
                  {thread.map((m) => (
                    <p
                      key={m.id}
                      className={`rounded-lg px-3 py-1.5 ${
                        m.senderId === me.id ? "ml-8 bg-accent text-white" : "mr-8 bg-slate-200 dark:bg-white/10"
                      }`}
                    >
                      {m.text}
                    </p>
                  ))}
                </div>
                {!mailOk(me) && (
                  <p className="mb-2 text-xs text-amber-500">Подтвердите почту, чтобы писать продавцу.</p>
                )}
                <form action={sendMessage} className="flex gap-2">
                  <input type="hidden" name="listingId" value={l.id} />
                  <input type="hidden" name="receiverId" value={l.userId} />
                  <input name="text" required maxLength={2000} placeholder="Сообщение…" className="input" />
                  <button className="btn">Отправить</button>
                </form>
              </>
            )}
          </div>
        )}

        {me && <AutoRefresh />}
        <SellerReviews sellerId={l.userId} />
      </aside>
    </div>
  );
}