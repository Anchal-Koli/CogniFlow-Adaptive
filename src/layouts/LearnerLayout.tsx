import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LearnerSidebar } from "@/components/layout/LearnerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, Search, Sparkles } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/app/dashboard": "Learning Dashboard",
  "/app/courses": "Courses",
  "/app/quizzes": "Quizzes",
  "/app/knowledge": "Knowledge Graph",
  "/app/analytics": "Performance Analytics",
  "/app/tutor": "AI Tutor",
  "/app/leaderboard": "Leaderboard",
  "/app/profile": "Profile",
};

export default function LearnerLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitle =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith("/app/courses/") ? "Course Details" : "") ||
    (location.pathname.startsWith("/app/quizzes/") ? "Quiz Session" : "") ||
    "Learning Workspace";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <LearnerSidebar />

        <main className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <SidebarTrigger />

                <div className="min-w-0">
                  <h1 className="text-sm md:text-base font-semibold text-foreground truncate">
                    {pageTitle}
                  </h1>
                  <p className="hidden md:block text-xs text-muted-foreground truncate">
                    Welcome back, {profile?.display_name || "Learner"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:inline-flex items-center gap-2 text-muted-foreground"
                  onClick={() => navigate("/app/tutor")}
                >
                  <Sparkles className="h-4 w-4" />
                  Ask AI Tutor
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/app/courses")}
                  aria-label="Search courses"
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
            <div className="w-full max-w-[1600px] mx-auto px-4 py-4 md:px-6 md:py-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}