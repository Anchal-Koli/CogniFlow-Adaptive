import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Activity,
  Settings,
  Shield,
  Brain,
  Database,
  BarChart3,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Courses", url: "/admin/courses", icon: GraduationCap },
  { title: "Quizzes", url: "/admin/quizzes", icon: BookOpen },
  { title: "System Logs", url: "/admin/logs", icon: Activity },
  { title: "Platform Settings", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();

  const isActive = (url: string) => {
    if (url === "/admin") return location.pathname === "/admin";
    return location.pathname === url || location.pathname.startsWith(`${url}/`);
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>

          <div className="min-w-0">
            <h2 className="font-bold text-base text-sidebar-foreground truncate">
              CogniFlow Admin
            </h2>
            <p className="text-[11px] text-sidebar-foreground/70 truncate">
              Platform Control Console
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>CONTROL PANEL</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = isActive(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={
                        active
                          ? "bg-primary/10 text-primary border border-primary/20 font-medium"
                          : "border border-transparent"
                      }
                    >
                      <NavLink to={item.url}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>OPS</SidebarGroupLabel>

          <SidebarGroupContent>
            <div className="px-2 space-y-2">
              <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold text-sidebar-foreground">Data Layer</p>
                </div>
                <p className="text-[11px] leading-5 text-sidebar-foreground/70">
                  Supabase-backed admin operations and role-controlled data access.
                </p>
              </div>

              <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold text-sidebar-foreground">Governance</p>
                </div>
                <p className="text-[11px] leading-5 text-sidebar-foreground/70">
                  Keep admin actions audit-friendly. Never trust frontend-only control.
                </p>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-xs text-sidebar-foreground/80">
          <Shield className="h-4 w-4 text-primary" />
          Secure admin area
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}