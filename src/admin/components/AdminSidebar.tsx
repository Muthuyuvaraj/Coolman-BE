import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag, CreditCard, BarChart3, Settings, ChevronLeft,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Dashboard", url: "/admin-dashboard", icon: LayoutDashboard },
  { title: "Products", url: "/admin-dashboard/products", icon: Package },
  { title: "Orders", url: "/admin-dashboard/orders", icon: ShoppingCart },
  { title: "Customers", url: "/admin-dashboard/customers", icon: Users },
  { title: "Coupons", url: "/admin-dashboard/coupons", icon: Tag },
  { title: "Payments", url: "/admin-dashboard/payments", icon: CreditCard },
  { title: "Analytics", url: "/admin-dashboard/analytics", icon: BarChart3 },
  { title: "Settings", url: "/admin-dashboard/settings", icon: Settings },
];

export default function AdminSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-2 overflow-hidden group-data-[collapsible=icon]:justify-center">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-primary/30 bg-primary text-primary-foreground font-display text-[10px] font-black tracking-tight shadow-sm">
            <span aria-hidden="true">CM</span>
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-base text-sidebar-foreground truncate">
              Coolman Admin
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <NavLink to={item.url} end>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 group-data-[collapsible=icon]:p-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="h-8 w-full justify-center overflow-hidden group-data-[collapsible=icon]:w-8"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          {!collapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
