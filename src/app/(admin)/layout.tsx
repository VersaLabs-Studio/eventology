import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardTopbar breadcrumb="Admin Panel" />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
