import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type Role = "student" | "instructor" | "admin";

interface RequireRoleProps {
  allowed: Role[];
  children: React.ReactNode;
}

function getRoleHome(role: string | null) {
  if (role === "admin") return "/admin";
  if (role === "instructor") return "/creator";
  return "/app/dashboard";
}

export default function RequireRole({ allowed, children }: RequireRoleProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">Checking access</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Verifying your session and role permissions...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!role || !allowed.includes(role as Role)) {
    return (
      <Navigate
        to={getRoleHome(role)}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}