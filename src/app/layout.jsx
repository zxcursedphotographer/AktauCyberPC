import "./globals.css";
import Link from "next/link";
import { Cpu, MessageSquare, Shield, LifeBuoy } from "lucide-react";
import { getUser, isStaff, mailOk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logout, resendVerify } from "./actions";
import ThemeToggle from "@/components/ThemeToggle";
import Avatar from "@/components/Avatar";

export const metadata = { title: "AktauCyberPC — б/у ПК и комплектующие с проверкой", description: "Покупайте железо с результатами тестов" };

export default async function RootLayout({ children }) {
  const me = await getUser();
  const unread = me ? await prisma.message.count({ where: { receiverId: me.id, isRead: false } }) : 0;
  return (
    <html lang="ru" className="dark" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.theme==="light")document.documentElement.classList.remove("dark")}catch(e){}` }} /></head>
      <body>
        <header className="border-b border-slate-200 dark:border-white/10 bg-white/70 dark:bg-panel/80">
          <nav className="mx-auto flex max-w-7xl items-center gap-4 p-3">
            <Link href="/" className="flex items-center gap-2 font-bold"><Cpu className="text-accent" /> AktauCyberPC</Link>
            <span className="flex-1" />
            <Link href="/sellers" className="text-sm">Продавцы</Link>
            <Link href="/guide" className="text-sm">Гайды</Link>
            <Link href="/support" className="flex items-center gap-1 text-sm"><LifeBuoy size={16} /> Поддержка</Link>
            {(me?.role === "SUPER_ADMIN" || me?.status === "UNDER_REVIEW") && <Link href="/review" className="text-sm">Проверка</Link>}
            {isStaff(me) && <Link href="/admin" className="flex items-center gap-1 text-sm"><Shield size={16} /> Админка</Link>}
            {me && <Link href="/chat" className="relative flex items-center gap-1 text-sm" title="Сообщения"><MessageSquare size={16} /><span className="hidden sm:inline">Сообщения</span>{unread > 0 && <b className="rounded-full bg-hot px-1.5 text-xs text-white">{unread}</b>}</Link>}
            <ThemeToggle />
            {me ? <form action={logout} className="flex items-center gap-2 text-sm"><Link href={`/u/${me.username}`} className="flex items-center gap-2 font-semibold"><Avatar user={me} size={26} />{me.username}</Link><button className="underline">Выйти</button></form>
                : <Link href="/login" className="btn">Войти</Link>}
          </nav>
        </header>
        {me && !mailOk(me) && <form action={resendVerify} className="bg-amber-500/20 p-2 text-center text-sm">Подтвердите почту ({me.email}), чтобы публиковать объявления и писать в чат. <button className="underline">Отправить письмо ещё раз</button></form>}
        <main className="mx-auto max-w-7xl p-4">{children}</main>
      </body>
    </html>
  );
}