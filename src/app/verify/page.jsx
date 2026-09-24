import Link from "next/link";
import { prisma } from "@/lib/prisma";
export default async function Verify({ searchParams: p }) {
  const t = p.token ? await prisma.token.findUnique({ where: { token: String(p.token) } }) : null;
  const ok = t && t.type === "VERIFY" && t.expiresAt > new Date();
  if (ok) { await prisma.user.update({ where: { id: t.userId }, data: { emailVerified: true } }); await prisma.token.delete({ where: { id: t.id } }); }
  return (
    <div className="card mx-auto max-w-sm space-y-3">
      <h1 className="text-xl font-bold">{ok ? "Почта подтверждена" : "Ссылка недействительна"}</h1>
      <p className="text-sm opacity-80">{ok ? "Теперь можно публиковать объявления и писать продавцам." : "Запросите новое письмо в жёлтом баннере на сайте."}</p>
      <Link href="/" className="btn">На главную</Link>
    </div>
  );
}
