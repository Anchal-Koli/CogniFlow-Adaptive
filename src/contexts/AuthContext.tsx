import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "student" | "instructor" | "admin";

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  skill_rating: number;
  xp: number;
  xp_to_next: number;
  level: number;
  streak: number;
  learning_style: string | null;
  cognitive_efficiency: number | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  role: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const resetAuthState = useCallback(() => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  }, []);

  const fetchProfileAndRole = useCallback(async (userId: string) => {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
    ]);

    if (profileRes.error) {
      console.error("Profile fetch failed:", profileRes.error);
    }

    if (roleRes.error) {
      console.error("Role fetch failed:", roleRes.error);
    }

    setProfile((profileRes.data as Profile) || null);

    // IMPORTANT:
    // Only default to student if query succeeds and no explicit role exists.
    // If query fails, keep role as null instead of lying.
    if (!roleRes.error) {
      setRole((roleRes.data?.role as AppRole | undefined) || "student");
    } else {
      setRole(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      await fetchProfileAndRole(user.id);
    } catch (error) {
      console.error("Refresh profile failed:", error);
      setProfile(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [user, fetchProfileAndRole]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);

        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Get session failed:", error);
          if (mounted) resetAuthState();
          return;
        }

        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchProfileAndRole(currentSession.user.id);
        } else {
          setProfile(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Auth init failed:", error);
        if (mounted) {
          setProfile(null);
          setRole(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        setLoading(true);
        try {
          await fetchProfileAndRole(nextSession.user.id);
        } catch (error) {
          console.error("Auth state profile/role fetch failed:", error);
          setProfile(null);
          setRole(null);
        } finally {
          if (mounted) setLoading(false);
        }
      } else {
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfileAndRole, resetAuthState]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      resetAuthState();
      setLoading(false);
    }
  }, [resetAuthState]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}