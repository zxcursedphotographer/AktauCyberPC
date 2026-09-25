import "./globals.css";
import localFont from "next/font/local";
import Link from "next/link";
import { Cpu, MessageSquare, Shield, LifeBuoy, Store, BookOpen } from "lucide-react";
import { getUser, isStaff, mailOk } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logout, resendVerify } from "./actions";
import Avatar from "@/components/Avatar";
import UserMenu from "@/components/UserMenu";

// Логотип — Metal Mania
const metalMania = localFont({
  src: [
    {
      path: "../../public/fonts/MetalMania-Regular.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-metal",
  display: "swap",
});

// Основной шрифт сайта — Iosevka Charon Mono Medium
const iosevka = localFont({
  src: [
    {
      path: "../../public/fonts/IosevkaCharonMono-Medium.ttf",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-scribble",
  display: "swap",
});

export const metadata = {
  title: "AktauCyberPC — б/у ПК и комплектующие с проверкой",
  description: "Покупайте железо с результатами тестов",
};

const navLink =
  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white";

export default async function RootLayout({ children }) {
  const me = await getUser();
  const unread = me
    ? await prisma.message.count({ where: { receiverId: me.id, isRead: false } })
    : 0;

  return (
    <html
      lang="ru"
      className={`dark ${iosevka.variable} ${metalMania.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans">
        <header className="sticky top-0 z-40 px-3 pt-3">
          <nav className="mx-auto flex max-w-7xl items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-panel/60 dark:shadow-black/20">

            <Link
              href="/"
              className="group flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-slate-900/5 dark:hover:bg-white/10"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-hot shadow-lg shadow-accent/30 transition group-hover:scale-105">
                <Cpu size={18} className="text-white" />
              </span>
              <span className="font-metal bg-gradient-to-r from-accent to-hot bg-clip-text text-lg text-transparent">
                AktauCyberPC
              </span>
            </Link>

            <span className="flex-1" />

            <div className="hidden items-center gap-1 md:flex">
              <Link href="/sellers" className={navLink}>
                <Store size={16} /> Продавцы
              </Link>
              <Link href="/guide" className={navLink}>
                <BookOpen size={16} /> Гайды
              </Link>
              <Link href="/support" className={navLink}>
                <LifeBuoy size={16} /> Поддержка
              </Link>
              {(me?.role === "SUPER_ADMIN" || me?.status === "UNDER_REVIEW") && (
                <Link href="/review" className={navLink}>Проверка</Link>
              )}
              {isStaff(me) && (
                <Link href="/admin" className={navLink}>
                  <Shield size={16} /> Админка
                </Link>
              )}
            </div>

            <span className="mx-1 hidden h-6 w-px bg-slate-300/60 dark:bg-white/15 md:block" />

            {me && (
              <Link href="/chat" className={`${navLink} relative`} title="Сообщения">
                <MessageSquare size={16} />
                <span className="hidden sm:inline">Сообщения</span>
                {unread > 0 && (
                  <b className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-hot px-1 text-[10px] font-bold text-white">
                    {unread}
                  </b>
                )}
              </Link>
            )}

            {me ? (
              <UserMenu username={me.username} avatarUrl={me.avatarUrl} logoutAction={logout} />
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition hover:brightness-110"
              >
                Войти
              </Link>
            )}
          </nav>
        </header>

        {me && !mailOk(me) && (
          <form
            action={resendVerify}
            className="mx-auto mt-3 max-w-7xl rounded-xl bg-amber-500/20 px-3 py-2 text-center text-sm"
          >
            Подтвердите почту ({me.email}), чтобы публиковать объявления и писать в чат.{" "}
            <button className="underline">Отправить письмо ещё раз</button>
          </form>
        )}

        <main className="mx-auto max-w-7xl p-4">{children}</main>
      </body>
    </html>
  );
}