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
  FileText,
  BookOpen,
  Brain,
  PenSquare,
  Sparkles,
  Layers3,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { title: "Content Studio", url: "/creator/content", icon: Layers3 },
  { title: "Courses", url: "/creator/courses", icon: BookOpen },
  { title: "Quizzes", url: "/creator/quizzes", icon: PenSquare },
];

export function CreatorSidebar() {
  const location = useLocation();

  const isActive = (url: string) => {
    if (url === "/creator") return location.pathname === "/creator";
    return location.pathname === url || location.pathname.startsWith(`${url}/`);
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>

          <div className="min-w-0">
            <h2 className="font-bold text-base text-sidebar-foreground truncate">
              CogniFlow Studio
            </h2>
            <p className="text-[11px] text-sidebar-foreground/70 truncate">
              Creator Workspace
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>AUTHORING</SidebarGroupLabel>

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
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-2">
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-sidebar-foreground">
                Creator Tip
              </p>
            </div>

            <p className="text-[11px] leading-5 text-sidebar-foreground/70">
              Don’t publish content directly. Validate title, topic, difficulty,
              and question completeness first.
            </p>
          </div>

          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/30 px-3 py-2 text-[11px] text-sidebar-foreground/70 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-primary" />
            Draft-first authoring workflow
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}