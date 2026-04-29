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
  BookOpen,
  Network,
  BarChart3,
  Bot,
  Trophy,
  User,
  Brain,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
  { title: "Courses", url: "/app/courses", icon: GraduationCap },
  { title: "Quizzes", url: "/app/quizzes", icon: BookOpen },
  { title: "Knowledge Graph", url: "/app/knowledge", icon: Network },
  { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
  { title: "AI Tutor", url: "/app/tutor", icon: Bot },
  { title: "Leaderboard", url: "/app/leaderboard", icon: Trophy },
  { title: "Profile", url: "/app/profile", icon: User },
];

export function LearnerSidebar() {
  const location = useLocation();

  const isActive = (url: string) => {
    if (url === "/app/courses") {
      return (
        location.pathname === "/app/courses" ||
        location.pathname.startsWith("/app/courses/")
      );
    }

    if (url === "/app/quizzes") {
      return (
        location.pathname === "/app/quizzes" ||
        location.pathname.startsWith("/app/quizzes/")
      );
    }

    return location.pathname === url;
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
              CogniFlow LMS
            </h2>
            <p className="text-[11px] text-sidebar-foreground/70 truncate">
              Learner Workspace
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>LEARNING</SidebarGroupLabel>

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
        <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-sidebar-foreground">Learning Tip</p>
          </div>

          <p className="text-[11px] leading-5 text-sidebar-foreground/70">
            Don’t jump between too many modules. Finish one course, then quiz immediately.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}