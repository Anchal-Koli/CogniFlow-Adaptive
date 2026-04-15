import { Brain, LayoutDashboard, BookOpen, Network, BarChart3, MessageSquare, User, Trophy, Settings2, Shield } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

const studentNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Quizzes", url: "/quizzes", icon: BookOpen },
  { title: "Knowledge Graph", url: "/knowledge", icon: Network },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "AI Tutor", url: "/tutor", icon: MessageSquare },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Profile", url: "/profile", icon: User },
];

const instructorNav = [
  ...studentNav,
  { title: "Manage Content", url: "/manage", icon: Settings2 },
];

const adminNav = [
  ...instructorNav,
  { title: "Admin Panel", url: "/admin", icon: Shield },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, role } = useAuth();

  const nav = role === "admin" ? adminNav : role === "instructor" ? instructorNav : studentNav;

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-card">
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg gradient-neural flex items-center justify-center shrink-0">
          <Brain size={16} className="text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-foreground tracking-tight leading-none">Cogniflow</h1>
            <p className="text-[10px] text-muted-foreground font-mono">Adaptive Learning</p>
          </div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] text-muted-foreground uppercase tracking-widest">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                      activeClassName="text-neural bg-neural/10 border border-neural/20">
                      <item.icon size={18} className="shrink-0" />
                      {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && profile && (
        <div className="mt-auto p-4 border-t border-border">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Level {profile.level}</span>
            <span className="font-mono text-neural">{profile.xp} / {profile.xp_to_next} XP</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full gradient-neural rounded-full" style={{ width: `${(profile.xp / profile.xp_to_next) * 100}%` }} />
          </div>
        </div>
      )}
    </Sidebar>
  );
}
