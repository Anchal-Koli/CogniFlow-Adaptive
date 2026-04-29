import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CreatorSidebar } from "@/components/layout/CreatorSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Bell,
  LogOut,
  Settings,
  FileText,
  Sparkles,
  PenSquare,
} from "lucide-react";

const pageTitles: Record<string, string> = {
  "/creator": "Creator Workspace",
  "/creator/content": "Content Studio",
  "/creator/courses": "Course Builder",
  "/creator/quizzes": "Quiz Builder",
};

export default function CreatorLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitle = pageTitles[location.pathname] || "Creator Workspace";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CreatorSidebar />

        <main className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <SidebarTrigger />

                <div className="min-w-0">
                  <h1 className="text-sm md:text-base font-semibold text-foreground truncate">
                    {pageTitle}
                  </h1>
                  <p className="hidden md:block text-xs text-muted-foreground truncate">
                    Creator Workspace • {profile?.display_name || "Instructor"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden lg:inline-flex items-center gap-2 text-muted-foreground"
                  onClick={() => navigate("/creator/content")}
                >
                  <Sparkles className="h-4 w-4" />
                  Content Studio
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:inline-flex items-center gap-2 text-muted-foreground"
                  onClick={() => navigate("/creator/courses")}
                >
                  <FileText className="h-4 w-4" />
                  Courses
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/creator/quizzes")}
                  aria-label="Quiz builder"
                >
                  <PenSquare className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/creator/content")}
                  aria-label="Creator settings"
                >
                  <Settings className="h-5 w-5" />
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
            <div className="w-full max-w-[1700px] mx-auto px-4 py-4 md:px-6 md:py-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}