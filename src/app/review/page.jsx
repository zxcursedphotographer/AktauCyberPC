import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { sendSupport, closeReview } from "@/app/actions";
import Avatar from "@/components/Avatar";
import AutoRefresh from "@/components/AutoRefresh";

export const metadata = { title: "Проверка — AktauCyberPC" };

export default async function ReviewPage({ searchParams: p }) {
  const me = await getUser(); if (!me) redirect("/login");
  const sa = me.role === "SUPER_ADMIN";
  if (!sa && me.status !== "UNDER_REVIEW") redirect("/");
  const owner = sa ? me : await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  const queue = sa ? await prisma.user.findMany({ where: { status: "UNDER_REVIEW" } }) : [];
  const other = sa ? queue.find((u) => u.id === p.u) || queue[0] : owner;
  let thread = [];
  if (other) {
    thread = await prisma.message.findMany({ where: { listingId: null, OR: [{ senderId: me.id, receiverId: other.id }, { senderId: other.id, receiverId: me.id }] }, orderBy: { createdAt: "asc" } });
    await prisma.message.updateMany({ where: { listingId: null, senderId: other.id, receiverId: me.id, isRead: false }, data: { isRead: true } });
  }
  return (
    <div className={`grid gap-4 ${sa ? "md:grid-cols-[280px_1fr]" : ""}`}>
      <AutoRefresh />
      {sa && (
        <aside className="card space-y-1"><h2 className="mb-1 font-semibold">На проверке ({queue.length})</h2>
          {queue.length === 0 && <p className="text-sm opacity-70">Никого нет. Отправить на проверку можно в Админке через меню «⋯».</p>}
          {queue.map((u) => <Link key={u.id} href={`/review?u=${u.id}`} className={`flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-white/10 ${other?.id === u.id ? "bg-white/10" : ""}`}><Avatar user={u} size={28} />{u.username}</Link>)}
        </aside>)}
      <section className="card flex min-h-[60vh] flex-col">
        {!other ? <p className="m-auto opacity-70">Выберите пользователя слева.</p> : <>
          <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
            <Avatar user={other} size={30} /><b>{sa ? other.username : "Администрация AktauCyberPC"}</b>
            {sa && <form action={closeReview} className="ml-auto"><input type="hidden" name="id" value={other.id} /><button className="btn !bg-emerald-600">Снять с проверки</button></form>}
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto text-sm">
            {thread.map((m) => { const adm = m.senderId === owner.id && (sa || m.senderId !== me.id);
              return <p key={m.id} className={`max-w-[75%] rounded-lg px-3 py-1.5 ${m.senderId === me.id ? "ml-auto bg-accent text-white" : "bg-slate-200 dark:bg-white/10"}`}>
                {adm && <b className="block text-xs opacity-80">Администратор</b>}{m.text}</p>; })}
          </div>
          <form action={sendSupport} className="mt-3 flex gap-2"><input type="hidden" name="receiverId" value={other.id} />
            <input name="text" required maxLength={2000} placeholder="Сообщение…" className="input" /><button className="btn">Отправить</button></form></>}
      </section>
    </div>
  );
}
