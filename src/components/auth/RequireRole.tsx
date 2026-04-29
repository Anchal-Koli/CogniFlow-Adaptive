import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type Role = "student" | "instructor" | "admin";

interface RequireRoleProps {
  allowed: Role[];
  children: React.ReactNode;
}

export default function RequireRole({ allowed, children }: RequireRoleProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!role) {
    return <Navigate to="/app/dashboard" replace />;
  }

  if (!allowed.includes(role as Role)) {
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "instructor") return <Navigate to="/creator/content" replace />;
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}