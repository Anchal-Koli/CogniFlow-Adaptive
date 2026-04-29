import { createContext, useContext, useEffect, useState } from "react";
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

  const loadUserData = async (currentUser: User) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch failed:", profileError);
        setProfile(null);
      } else {
        setProfile((profileData as Profile) || null);
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (roleError) {
        console.error("Role fetch failed:", roleError);
        setRole("student");
      } else {
        setRole((roleData?.role as AppRole | undefined) || "student");
      }
    } catch (err) {
      console.error("loadUserData failed:", err);
      setProfile(null);
      setRole("student");
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    await loadUserData(user);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setLoading(true);

        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await loadUserData(currentSession.user);
        } else {
          setProfile(null);
          setRole(null);
        }
      } catch (err) {
        console.error("Auth init failed:", err);
        if (!mounted) return;
        setProfile(null);
        setRole(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        // IMPORTANT: do NOT await here; avoid lock cascades
        loadUserData(nextSession.user)
          .catch((err) => console.error("Auth state loadUserData failed:", err))
          .finally(() => {
            if (mounted) setLoading(false);
          });
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
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
      setLoading(false);
    }
  };

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