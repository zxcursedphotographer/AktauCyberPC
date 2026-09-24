import { redirect } from "next/navigation";
import { getUser, isStaff } from "@/lib/auth";
import AdminSidebar from "@/components/AdminSidebar";

export const metadata = { title: "Админка — AktauCyberPC" };

export default async function AdminLayout({ children }) {
  const me = await getUser();
  if (!isStaff(me)) redirect("/");
  const sa = me.role === "SUPER_ADMIN";

  return (
    <div className="grid gap-4 md:grid-cols-[240px_1fr]">
      <AdminSidebar isSuperAdmin={sa} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}