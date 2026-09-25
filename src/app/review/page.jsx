import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { closeReview } from "@/app/actions";
import Avatar from "@/components/Avatar";
import AutoRefresh from "@/components/AutoRefresh";
import ChatThread from "@/components/ChatThread";
import ChatForm from "@/components/ChatForm";
import ChatHeaderMenu from "@/components/ChatHeaderMenu";

export const metadata = { title: "Проверка" };

export default async function ReviewPage({ searchParams: p }) {
  const me = await getUser();
  if (!me) redirect("/login");

  const sa = me.role === "SUPER_ADMIN";
  if (!sa && me.status !== "UNDER_REVIEW") redirect("/");

  const owner = sa ? me : await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
    select: { id: true, username: true, avatarUrl: true, lastSeen: true },
  });

  const queue = sa
    ? await prisma.user.findMany({
        where: { status: "UNDER_REVIEW" },
        orderBy: { createdAt: "asc" },
        select: { id: true, username: true, avatarUrl: true, lastSeen: true },
      })
    : [];

  const other = sa ? queue.find((u) => u.id === p.u) || queue[0] : owner;

  let thread = [];
  let blockedByMe = false;
  let blockedByOther = false;

  if (other) {
    const [msgs, blockByMe, blockByOther] = await Promise.all([
      prisma.message.findMany({
        where: {
          listingId: null,
          OR: [
            { senderId: me.id, receiverId: other.id },
            { senderId: other.id, receiverId: me.id },
          ],
          NOT: [
            { senderId: me.id, deletedForSender: true },
            { receiverId: me.id, deletedForReceiver: true },
          ],
        },
        orderBy: { createdAt: "asc" },
        take: 200,
      }),
      prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: me.id, blockedId: other.id } },
      }),
      prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: other.id, blockedId: me.id } },
      }),
    ]);
    thread = msgs;
    blockedByMe = !!blockByMe;
    blockedByOther = !!blockByOther;

    prisma.message
      .updateMany({
        where: { listingId: null, senderId: other.id, receiverId: me.id, isRead: false },
        data: { isRead: true },
      })
      .catch(() => {});
  }

  return (
    <div className={`grid gap-4 md:h-[calc(100vh-120px)] ${sa ? "md:grid-cols-[280px_1fr]" : ""}`}>
      <AutoRefresh every={20000} />

      {sa && (
        <aside className="card flex min-h-0 flex-col md:overflow-hidden">
          <h2 className="mb-2 font-semibold">На проверке ({queue.length})</h2>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {queue.length === 0 && (
              <p className="text-sm opacity-70">
                Никого нет. Отправить на проверку можно в Админке через меню «⋯».
              </p>
            )}
            {queue.map((u) => (
              <Link
                key={u.id}
                href={`/review?u=${u.id}`}
                className={`flex items-center gap-2 rounded-lg p-2 text-sm transition ${
                  other?.id === u.id ? "bg-white/10 ring-1 ring-accent/40" : "hover:bg-white/10"
                }`}
              >
                <Avatar user={u} size={28} />
                <b className="truncate">{u.username}</b>
              </Link>
            ))}
          </div>
        </aside>
      )}

      <section className="card flex min-h-0 flex-col md:overflow-hidden">
        {!other ? (
          <p className="m-auto opacity-70">Выберите пользователя слева.</p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
              <Avatar user={other} size={30} />
              <b>{sa ? other.username : "Администрация AktauCyberPC"}</b>
              {sa && (
                <form action={closeReview}>
                  <input type="hidden" name="id" value={other.id} />
                  <button className="btn !bg-emerald-600 !py-1.5 !text-xs">Снять с проверки</button>
                </form>
              )}
              <ChatHeaderMenu listingId={null} otherId={other.id} blockedByMe={blockedByMe} />
            </div>

            {blockedByOther && (
              <p className="mb-2 rounded bg-hot/20 p-2 text-xs text-hot">
                Вы заблокированы. Сообщения не отправляются.
              </p>
            )}
            {blockedByMe && (
              <p className="mb-2 rounded bg-amber-500/20 p-2 text-xs text-amber-300">
                Вы заблокировали этого пользователя. Разблокируйте в меню ⋮, чтобы писать.
              </p>
            )}

            <ChatThread
              meId={me.id}
              initial={thread.map((m) => ({
                id: m.id,
                text: m.text,
                senderId: m.senderId,
                editedAt: m.editedAt,
                createdAt: m.createdAt,
                isRead: m.isRead,
              }))}
            />

            {!blockedByOther && !blockedByMe ? (
              <ChatForm mode="support" receiverId={other.id} />
            ) : (
              <p className="mt-3 text-center text-xs opacity-60">Отправка сообщений недоступна</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}