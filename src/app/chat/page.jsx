import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { sendMessage } from "@/app/actions";
import Avatar from "@/components/Avatar";
import AutoRefresh from "@/components/AutoRefresh";

export default async function Chat({ searchParams: p }) {
  const me = await getUser(); if (!me) redirect("/login");
  const selL = p.l ? await prisma.listing.findUnique({ where: { id: p.l } }) : null;
  const selU = p.u ? await prisma.user.findUnique({ where: { id: p.u } }) : null;
  const tab = p.tab || (selL ? (selL.userId === me.id ? "sell" : "buy") : "buy");
  const msgs = await prisma.message.findMany({ where: { listingId: { not: null }, OR: [{ senderId: me.id }, { receiverId: me.id }] }, orderBy: { createdAt: "desc" }, include: { listing: true, sender: true, receiver: true } });
  const convs = new Map();
  for (const m of msgs) {
    if (!m.listing) continue;
    const other = m.senderId === me.id ? m.receiver : m.sender, k = m.listingId + ":" + other.id;
    if (!convs.has(k)) convs.set(k, { k, listing: m.listing, other, last: m, unread: 0 });
    if (m.receiverId === me.id && !m.isRead) convs.get(k).unread++;
  }
  const list = [...convs.values()].filter((c) => (c.listing.userId === me.id) === (tab === "sell"));
  let thread = [];
  if (selL && selU) {
    thread = await prisma.message.findMany({ where: { listingId: selL.id, OR: [{ senderId: me.id, receiverId: selU.id }, { senderId: selU.id, receiverId: me.id }] }, orderBy: { createdAt: "asc" } });
    await prisma.message.updateMany({ where: { listingId: selL.id, senderId: selU.id, receiverId: me.id, isRead: false }, data: { isRead: true } });
  }
  const tabCls = (t) => `flex-1 rounded-lg px-3 py-1.5 text-center text-sm ${tab === t ? "bg-accent text-white" : "bg-slate-200 dark:bg-white/10"}`;
  return (
    <div className="grid gap-4 md:grid-cols-[320px_1fr]">
      <AutoRefresh />
      <aside className="card space-y-2">
        <div className="flex gap-2"><Link href="/chat?tab=buy" className={tabCls("buy")}>Покупаю</Link><Link href="/chat?tab=sell" className={tabCls("sell")}>Продаю</Link></div>
        {list.length === 0 && <p className="text-sm opacity-70">{tab === "buy" ? "Вы ещё не писали продавцам." : "Пока никто не написал по вашим объявлениям."}</p>}
        {list.map((c) => (
          <Link key={c.k} href={`/chat?tab=${tab}&l=${c.listing.id}&u=${c.other.id}`} className={`block rounded-lg p-2 text-sm hover:bg-white/10 ${selL?.id === c.listing.id && selU?.id === c.other.id ? "bg-white/10" : ""}`}>
            <div className="flex items-center justify-between"><span className="flex items-center gap-2"><Avatar user={c.other} size={28} /><b>{c.other.username}</b></span>{c.unread > 0 && <span className="rounded-full bg-hot px-1.5 text-xs text-white">{c.unread}</span>}</div>
            <div className="truncate opacity-70">{c.listing.title}</div><div className="truncate text-xs opacity-60">{c.last.text}</div>
          </Link>))}
      </aside>
      <section className="card flex min-h-[60vh] flex-col">
        {!selL || !selU ? <p className="m-auto opacity-70">Выберите диалог слева.</p> : <>
          <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-2"><Avatar user={selU} size={30} /><b>{selU.username}</b> · <Link href={`/listing/${selL.id}`} className="underline">{selL.title}</Link></div>
          <div className="flex-1 space-y-1 overflow-y-auto text-sm">
            {thread.map((m) => <p key={m.id} className={`max-w-[75%] rounded-lg px-3 py-1.5 ${m.senderId === me.id ? "ml-auto bg-accent text-white" : "bg-slate-200 dark:bg-white/10"}`}>{m.text}</p>)}
          </div>
          <form action={sendMessage} className="mt-3 flex gap-2">
            <input type="hidden" name="listingId" value={selL.id} /><input type="hidden" name="receiverId" value={selU.id} />
            <input name="text" required maxLength={2000} placeholder="Сообщение…" className="input" /><button className="btn">Отправить</button>
          </form></>}
      </section>
    </div>
  );
}
