import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Подтверждение почты" };

export default async function Verify({ searchParams: p }) {
  const token = p.token ? String(p.token) : null;
  const t = token
    ? await prisma.token.findUnique({ where: { token } })
    : null;

  const ok = t && t.type === "VERIFY" && t.expiresAt > new Date();

  if (ok) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: t.userId },
        data: { emailVerified: true },
      }),
      prisma.token.delete({ where: { id: t.id } }),
    ]);
  } else if (t && t.expiresAt <= new Date()) {
    // Чистим просроченный токен
    await prisma.token.delete({ where: { id: t.id } }).catch(() => {});
  }

  return (
    <div className="card mx-auto max-w-sm space-y-3">
      <div className="text-center text-4xl">{ok ? "✅" : "⚠️"}</div>
      <h1 className="text-xl font-bold text-center">
        {ok ? "Почта подтверждена" : "Ссылка недействительна"}
      </h1>
      <p className="text-sm opacity-80 text-center">
        {ok
          ? "Теперь можно публиковать объявления и писать продавцам."
          : "Ссылка устарела или уже использована. Запросите новое письмо."}
      </p>
      <Link href="/" className="btn w-full justify-center">
        На главную
      </Link>
    </div>
  );
}