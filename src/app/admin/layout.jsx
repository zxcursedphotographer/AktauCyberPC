import { redirect } from "next/navigation";
import { getUser, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminSidebar from "@/components/AdminSidebar";

export const metadata = { title: "Админка" };

export default async function AdminLayout({ children }) {
  const me = await getUser();
  if (!isStaff(me)) redirect("/");

  const sa = me.role === "SUPER_ADMIN";

  const [pendingReports, pendingListings, reviewUsers] = await Promise.all([
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.listing.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.listing.count({ where: { status: "APPEAL" } }),
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-[240px_1fr]">
      <AdminSidebar
        isSuperAdmin={sa}
        counts={{
          reports: pendingReports,
          listings: pendingListings,
          appeals: reviewUsers,
        }}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}