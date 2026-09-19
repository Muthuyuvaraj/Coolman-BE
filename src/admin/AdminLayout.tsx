import { Outlet } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <SidebarInset className="min-w-0">
          <AdminHeader />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />  
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
