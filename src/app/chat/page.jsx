import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import AutoRefresh from "@/components/AutoRefresh";
import ChatThread from "@/components/ChatThread";
import ChatForm from "@/components/ChatForm";
import ChatSidebar from "@/components/ChatSidebar";
import ChatHeader from "@/components/ChatHeader";

export const metadata = { title: "Сообщения" };

export default async function Chat({ searchParams: p }) {
  const me = await getUser();
  if (!me) redirect("/login");

  const selL = p.l ? await prisma.listing.findUnique({ where: { id: p.l } }) : null;
  const selU = p.u ? await prisma.user.findUnique({ where: { id: p.u } }) : null;
  const tab = p.tab || (selL ? (selL.userId === me.id ? "sell" : "buy") : "buy");

  // Список диалогов
  const msgs = await prisma.message.findMany({
    where: {
      listingId: { not: null },
      OR: [{ senderId: me.id }, { receiverId: me.id }],
      NOT: [
        { senderId: me.id, deletedForSender: true },
        { receiverId: me.id, deletedForReceiver: true },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      listing: { select: { id: true, title: true, userId: true } },
      sender: { select: { id: true, username: true, avatarUrl: true, lastSeen: true } },
      receiver: { select: { id: true, username: true, avatarUrl: true, lastSeen: true } },
    },
  });

  const convs = new Map();
  for (const m of msgs) {
    if (!m.listing) continue;
    const other = m.senderId === me.id ? m.receiver : m.sender;
    const k = m.listingId + ":" + other.id;
    if (!convs.has(k)) convs.set(k, { k, listing: m.listing, other, last: m, unread: 0 });
    if (m.receiverId === me.id && !m.isRead) convs.get(k).unread++;
  }
  const list = [...convs.values()].filter((c) => (c.listing.userId === me.id) === (tab === "sell"));

  // Активный диалог
  let thread = [];
  let blockedByMe = false;
  let blockedByOther = false;
  const hasActive = Boolean(selL && selU && selU.id !== me.id);

  if (hasActive) {
    const [msgsThread, blockByMe, blockByOther] = await Promise.all([
      prisma.message.findMany({
        where: {
          listingId: selL.id,
          OR: [
            { senderId: me.id, receiverId: selU.id },
            { senderId: selU.id, receiverId: me.id },
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
        where: { blockerId_blockedId: { blockerId: me.id, blockedId: selU.id } },
      }),
      prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: selU.id, blockedId: me.id } },
      }),
    ]);
    thread = msgsThread;
    blockedByMe = !!blockByMe;
    blockedByOther = !!blockByOther;

    // Отметить как прочитанное (fire and forget)
    prisma.message
      .updateMany({
        where: { listingId: selL.id, senderId: selU.id, receiverId: me.id, isRead: false },
        data: { isRead: true },
      })
      .catch(() => {});
  }

  const emptyText = tab === "buy" ? "Вы ещё не писали продавцам." : "Пока никто не написал по вашим объявлениям.";

  return (
    <div className="grid gap-4 md:h-[calc(100vh-120px)] md:grid-cols-[320px_1fr]">
      <AutoRefresh every={20000} />
      <ChatSidebar
        conversations={list}
        tab={tab}
        selLId={selL?.id}
        selUId={selU?.id}
        emptyText={emptyText}
      />
      <section className="card flex min-h-0 flex-col md:overflow-hidden">
        {!hasActive ? (
          <p className="m-auto opacity-70">Выберите диалог слева.</p>
        ) : (
          <>
            <ChatHeader other={selU} listing={selL} blockedByMe={blockedByMe} />

            {blockedByOther && (
              <p className="mb-2 rounded bg-hot/20 p-2 text-xs text-hot">
                Вы заблокированы этим пользователем. Сообщения не отправляются.
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
              <ChatForm listingId={selL.id} receiverId={selU.id} />
            ) : (
              <p className="mt-3 text-center text-xs opacity-60">Отправка сообщений недоступна</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}