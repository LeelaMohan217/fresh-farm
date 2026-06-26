import Sidebar from "@/components/admin/Sidebar";
import TopBar from "@/components/admin/TopBar";
import { SidebarProvider } from "@/components/admin/SidebarContext";
import { getAdminSession } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  const isSuperAdmin = session?.role === "superadmin";

  return (
    <SidebarProvider>
      {/* Outer wrapper — no overflow-hidden so sidebar toggle button isn't clipped */}
      <div className="flex h-screen bg-[#fbfff8]">

        {/* Sidebar wrapper — relative so the absolute toggle button overflows into content */}
        <div className="relative z-10 shrink-0">
          <Sidebar isSuperAdmin={isSuperAdmin} />
        </div>

        {/* Main content — overflow-hidden only here */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6 ">
            {children}
          </main>
        </div>

      </div>
    </SidebarProvider>
  );
}
