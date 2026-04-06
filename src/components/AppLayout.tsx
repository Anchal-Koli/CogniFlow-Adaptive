import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, Navigate } from "react-router-dom";
import { Bell, Search, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import PageLoader from "@/components/PageLoader";

const AppLayout = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><PageLoader /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const initials = profile?.display_name
    ? profile.display_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="hidden sm:flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5 border border-border">
                <Search size={14} className="text-muted-foreground" />
                <input placeholder="Search topics, quizzes..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-48" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                <Bell size={16} />
              </button>
              <button onClick={signOut} className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-destructive transition-colors" title="Sign out">
                <LogOut size={16} />
              </button>
              <div className="w-8 h-8 rounded-full gradient-neural flex items-center justify-center text-xs font-bold text-primary-foreground">{initials}</div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
