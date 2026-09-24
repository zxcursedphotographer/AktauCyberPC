"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Flag, Package, Users, ScrollText } from "lucide-react";

export default function AdminSidebar({ isSuperAdmin }) {
  const path = usePathname();

  const items = [
    { href: "/admin", label: "Дашборд", icon: LayoutDashboard, exact: true },
    { href: "/admin/reports", label: "Жалобы", icon: Flag },
    { href: "/admin/listings", label: "Объявления", icon: Package },
    ...(isSuperAdmin ? [
      { href: "/admin/users", label: "Пользователи", icon: Users },
      { href: "/admin/logs", label: "Журнал действий", icon: ScrollText },
    ] : []),
  ];

  return (
    <aside className="card h-fit space-y-1 md:sticky md:top-4">
      <h2 className="mb-2 px-2 text-sm font-bold uppercase tracking-wider opacity-60">Админка</h2>
      {items.map((it) => {
        const active = it.exact ? path === it.href : path.startsWith(it.href);
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
              active
                ? "bg-accent text-white shadow-lg shadow-accent/30"
                : "hover:bg-white/10"
            }`}
          >
            <Icon size={16} />
            {it.label}
          </Link>
        );
      })}
    </aside>
  );
}