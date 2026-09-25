import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUser, isStaff } from "@/lib/auth";
import { Package, Flag, Users, ShoppingBag, TrendingUp, AlertTriangle, Clock, ScrollText } from "lucide-react";

export const metadata = { title: "Дашборд" };

export default async function AdminDashboard() {
  const me = await getUser();
  if (!isStaff(me)) redirect("/");
  const sa = me.role === "SUPER_ADMIN";

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    publishedCount,
    pendingReports,
    bannedUsers,
    soldTotal,
    underReview,
    needsEdit,
    appeals,
    soldToday,
    newUsersToday,
    deletedTotal,
  ] = await Promise.all([
    prisma.listing.count({ where: { status: "PUBLISHED" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { status: "BANNED" } }),
    prisma.listing.count({ where: { status: "SOLD" } }),
    prisma.listing.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.listing.count({ where: { status: "NEEDS_EDIT" } }),
    prisma.listing.count({ where: { status: "APPEAL" } }),
    prisma.listing.count({ where: { status: "SOLD", createdAt: { gte: startOfDay } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.listing.count({ where: { status: "DELETED" } }),
  ]);

  const mainCards = [
    {
      label: "Активных объявлений",
      value: publishedCount,
      icon: Package,
      color: "text-accent",
      href: "/admin/listings?status=PUBLISHED",
    },
    {
      label: "На модерации",
      value: underReview,
      icon: Clock,
      color: "text-amber-400",
      href: "/admin/listings?status=UNDER_REVIEW",
      urgent: underReview > 0,
    },
    {
      label: "Жалоб в обработке",
      value: pendingReports,
      icon: Flag,
      color: "text-hot",
      href: "/admin/reports",
      urgent: pendingReports > 0,
    },
    {
      label: "Апелляций",
      value: appeals,
      icon: AlertTriangle,
      color: "text-orange-400",
      href: "/admin/listings?status=APPEAL",
      urgent: appeals > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Дашборд</h1>
        <p className="text-sm opacity-70">Общая статистика сайта</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {mainCards.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className={`card relative transition hover:border-accent ${
                s.urgent ? "!border-amber-500/40" : ""
              }`}
            >
              {s.urgent && s.value > 0 && (
                <span className="absolute right-3 top-3 h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider opacity-60">{s.label}</span>
                <Icon size={18} className={s.color} />
              </div>
              <p className={`mt-3 text-3xl font-bold ${s.color}`}>{s.value}</p>
            </Link>
          );
        })}
      </div>

      <div className="card">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <TrendingUp size={16} className="text-accent" /> Сегодня
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-xs opacity-60">Продано за сегодня</div>
            <div className="mt-1 text-2xl font-bold">{soldToday}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-xs opacity-60">Новых юзеров за сегодня</div>
            <div className="mt-1 text-2xl font-bold">{newUsersToday}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-xs opacity-60">Всего удалено</div>
            <div className="mt-1 text-2xl font-bold">{deletedTotal}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/admin/listings?status=NEEDS_EDIT" className="card flex items-center justify-between transition hover:border-orange-500/40">
          <div>
            <div className="text-xs opacity-60">Требуют правок</div>
            <div className="mt-1 text-xl font-bold text-orange-400">{needsEdit}</div>
          </div>
          <Package size={20} className="text-orange-400" />
        </Link>

        {sa && (
          <>
            <Link href="/admin/users?status=BANNED" className="card flex items-center justify-between transition hover:border-hot/40">
              <div>
                <div className="text-xs opacity-60">Забанено юзеров</div>
                <div className="mt-1 text-xl font-bold text-hot">{bannedUsers}</div>
              </div>
              <Users size={20} className="text-hot" />
            </Link>

            <Link href="/admin/listings?status=SOLD" className="card flex items-center justify-between transition hover:border-emerald-500/40">
              <div>
                <div className="text-xs opacity-60">Всего сделок</div>
                <div className="mt-1 text-xl font-bold text-emerald-400">{soldTotal}</div>
              </div>
              <ShoppingBag size={20} className="text-emerald-400" />
            </Link>
          </>
        )}
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold">Быстрые действия</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/listings?status=UNDER_REVIEW" className="btn">
            Модерация объявлений ({underReview})
          </Link>
          <Link href="/admin/reports" className="btn !bg-hot">
            Проверить жалобы ({pendingReports})
          </Link>
          {sa && (
            <>
              <Link href="/admin/users" className="btn">
                Управление юзерами
              </Link>
              <Link
                href="/admin/logs"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
              >
                <ScrollText size={14} /> Журнал
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}