import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Bell,
  LogOut,
  Shield,
  Settings,
  Activity,
  Search,
} from "lucide-react";

const pageTitles: Record<string, string> = {
  "/admin": "Platform Overview",
  "/admin/users": "User Management",
  "/admin/courses": "Course Governance",
  "/admin/quizzes": "Quiz Governance",
  "/admin/logs": "System Logs",
  "/admin/settings": "Platform Settings",
};

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitle = pageTitles[location.pathname] || "Admin Console";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <main className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <SidebarTrigger />

                <div className="min-w-0">
                  <h1 className="text-sm md:text-base font-semibold text-foreground truncate">
                    {pageTitle}
                  </h1>
                  <p className="hidden md:flex items-center gap-2 text-xs text-muted-foreground truncate">
                    <Shield className="h-3.5 w-3.5" />
                    Admin Console • {profile?.display_name || "Administrator"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden lg:inline-flex items-center gap-2 text-muted-foreground"
                  onClick={() => navigate("/admin/logs")}
                >
                  <Activity className="h-4 w-4" />
                  Logs
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:inline-flex items-center gap-2 text-muted-foreground"
                  onClick={() => navigate("/admin/settings")}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/admin/users")}
                  aria-label="User management"
                >
                  <Search className="h-5 w-5" />
                </Button>

                <Button variant="ghost" size="icon" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          <div className="flex-1">
            <div className="w-full max-w-[1800px] mx-auto px-4 py-4 md:px-6 md:py-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}