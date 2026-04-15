import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users,
  BookOpen,
  GraduationCap,
  BarChart3,
  Settings,
  Shield,
  Search,
  Trash2,
  Edit,
  UserCog,
  TrendingUp,
  Activity,
  Target,
  Award,
  ArrowUpDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UserProfile {
  id: string;
  display_name: string;
  email?: string | null;
  avatar_url: string | null;
  level: number;
  xp: number;
  skill_rating: number;
  streak: number;
  created_at: string;
  role?: "admin" | "instructor" | "student";
}

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalQuizzes: number;
  totalAttempts: number;
  avgRating: number;
  activeToday: number;
}

interface CourseWithCreator {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  is_published: boolean;
  created_at: string;
  created_by: string | null;
  profiles?: { display_name: string }[];
}

interface QuizWithCreator {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  is_published: boolean;
  created_at: string;
  created_by: string | null;
  questions: unknown[];
  profiles?: { display_name: string }[];
}

export default function AdminDashboard() {
  const qc = useQueryClient();

  const [tab, setTab] = useState<"dashboard" | "users" | "content">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [newRole, setNewRole] = useState<string>("");

  const [statsError, setStatsError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [quizzesError, setQuizzesError] = useState<string | null>(null);

  // -----------------------------
  // Stats
  // -----------------------------
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      try {
        const [usersRes, coursesRes, quizzesRes, attemptsRes, ratingsRes] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("courses").select("id", { count: "exact", head: true }),
          supabase.from("quizzes").select("id", { count: "exact", head: true }),
          supabase.from("quiz_attempts").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("skill_rating"),
        ]);

        if (usersRes.error) throw usersRes.error;
        if (coursesRes.error) throw coursesRes.error;
        if (quizzesRes.error) throw quizzesRes.error;
        if (attemptsRes.error) throw attemptsRes.error;
        if (ratingsRes.error) throw ratingsRes.error;

        const today = new Date().toISOString().split("T")[0];
        const activeRes = await supabase
          .from("quiz_attempts")
          .select("user_id", { count: "exact", head: true })
          .gte("created_at", today);

        if (activeRes.error) throw activeRes.error;

        const avgRating =
          ratingsRes.data?.length
            ? ratingsRes.data.reduce((sum, p) => sum + (p.skill_rating || 0), 0) / ratingsRes.data.length
            : 0;

        return {
          totalUsers: usersRes.count || 0,
          totalCourses: coursesRes.count || 0,
          totalQuizzes: quizzesRes.count || 0,
          totalAttempts: attemptsRes.count || 0,
          avgRating: Math.round(avgRating),
          activeToday: activeRes.count || 0,
        };
      } catch (e) {
        setStatsError(e instanceof Error ? e.message : "Failed to load stats");
        throw e;
      }
    },
    retry: 1,
  });

  // -----------------------------
  // Users (FIXED: uses Edge Function instead of auth.listUsers in frontend)
  // -----------------------------
  const { data: users = [], isLoading: usersLoading } = useQuery<UserProfile[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (profilesError) throw profilesError;

        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("*");

        if (rolesError) throw rolesError;

        const { data: usersResponse, error: usersFnError } = await supabase.functions.invoke("admin-users", {
          body: { action: "listUsers" },
        });

        if (usersFnError) throw usersFnError;

        const authUsers = usersResponse?.users || [];

        return (profiles || []).map((profile) => {
          const roleRecord = roles?.find((r: { user_id: string; role: string }) => r.user_id === profile.id);
          const authUser = authUsers.find((u: { id: string; email?: string }) => u.id === profile.id);

          return {
            ...profile,
            email: authUser?.email || null,
            role: (roleRecord?.role || "student") as "admin" | "instructor" | "student",
          };
        });
      } catch (e) {
        setUsersError(e instanceof Error ? e.message : "Failed to load users");
        throw e;
      }
    },
    retry: 1,
  });

  // -----------------------------
  // Courses
  // -----------------------------
  const { data: courses = [] } = useQuery<CourseWithCreator[]>({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("*, profiles!courses_created_by_fkey(display_name)")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (e) {
        setCoursesError(e instanceof Error ? e.message : "Failed to load courses");
        throw e;
      }
    },
    retry: 1,
  });

  // -----------------------------
  // Quizzes
  // -----------------------------
  const { data: quizzes = [] } = useQuery<QuizWithCreator[]>({
    queryKey: ["admin-quizzes"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("quizzes")
          .select("*, profiles!quizzes_created_by_fkey(display_name)")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (e) {
        setQuizzesError(e instanceof Error ? e.message : "Failed to load quizzes");
        throw e;
      }
    },
    retry: 1,
  });

  // -----------------------------
  // Role update (still DB-based)
  // -----------------------------
  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError && !deleteError.message.includes("No rows")) throw deleteError;

      if (role !== "student") {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: role as "admin" | "instructor" });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setEditUserOpen(false);
      setSelectedUser(null);
      setNewRole("");
      toast.success("User role updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // -----------------------------
  // Delete user (FIXED: Edge Function)
  // -----------------------------
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.functions.invoke("admin-users", {
        body: { action: "deleteUser", userId },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // -----------------------------
  // Optional status toggle (FIXED: Edge Function)
  // Not used in UI below, but kept ready if you want it later
  // -----------------------------
  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, disabled }: { userId: string; disabled: boolean }) => {
      const { error } = await supabase.functions.invoke("admin-users", {
        body: { action: "updateUserStatus", userId, disabled },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Prevent TS unused warning if you don’t use status toggle UI yet
  void toggleUserStatus;

  const openEditRole = (user: UserProfile) => {
    setSelectedUser({
      id: user.id,
      name: user.display_name,
      role: user.role || "student",
    });
    setNewRole(user.role || "student");
    setEditUserOpen(true);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      trend: "+12%",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Active Today",
      value: stats?.activeToday || 0,
      icon: Activity,
      trend: "+5%",
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Total Courses",
      value: stats?.totalCourses || 0,
      icon: GraduationCap,
      trend: "+3",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Total Quizzes",
      value: stats?.totalQuizzes || 0,
      icon: BookOpen,
      trend: "+8",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Quiz Attempts",
      value: stats?.totalAttempts || 0,
      icon: Target,
      trend: "+24%",
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
    {
      title: "Avg Rating",
      value: stats?.avgRating || 0,
      icon: Award,
      trend: "+2pts",
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage users and system analytics</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(["dashboard", "users", "content"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "text-primary border-b-2 border-primary -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* DASHBOARD TAB */}
      {tab === "dashboard" && (
        <div className="space-y-6">
          {statsError && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <p className="text-destructive text-sm">Error loading stats: {statsError}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-3xl font-bold mt-1">{stat.value}</p>
                        <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                          <TrendingUp size={12} />
                          {stat.trend} from last month
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bg}`}>
                        <stat.icon size={24} className={stat.color} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 size={18} />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: "New user registered", time: "2 min ago" },
                    { action: "Quiz completed: Math 101", time: "5 min ago" },
                    { action: "Course published: Physics", time: "1 hour ago" },
                    { action: "New instructor added", time: "2 hours ago" },
                  ].map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <span className="text-sm">{activity.action}</span>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings size={18} />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setTab("users")}>
                    <UserCog size={20} />
                    <span className="text-xs">Manage Users</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setTab("content")}>
                    <BookOpen size={20} />
                    <span className="text-xs">Manage Content</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Shield size={20} />
                    <span className="text-xs">System Settings</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <BarChart3 size={20} />
                    <span className="text-xs">Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {usersError ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-destructive text-sm">Error loading users: {usersError}</p>
              </CardContent>
            </Card>
          ) : usersLoading ? (
            <div className="text-muted-foreground text-sm">Loading users…</div>
          ) : filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">No users found</CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border bg-muted/50">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                          <div className="flex items-center gap-1">
                            User <ArrowUpDown size={14} />
                          </div>
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Level</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                          <div className="flex items-center gap-1">
                            Rating <ArrowUpDown size={14} />
                          </div>
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                          <div className="flex items-center gap-1">
                            Role <ArrowUpDown size={14} />
                          </div>
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      <AnimatePresence>
                        {filteredUsers.map((user) => (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border-b border-border hover:bg-muted/30 transition-colors"
                          >
                            <td className="p-4">
                              <div>
                                <p className="font-medium">{user.display_name}</p>
                                <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                              </div>
                            </td>

                            <td className="p-4">
                              <Badge variant="outline">Lvl {user.level}</Badge>
                            </td>

                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <Award size={14}className="text-yellow-500" />
                                <span>{user.skill_rating}</span>
                              </div>
                            </td>

                            <td className="p-4">
                              <Badge
                                variant={
                                  user.role === "admin"
                                    ? "default"
                                    : user.role === "instructor"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {user.role}
                              </Badge>
                            </td>

                            <td className="p-4">
                              <span className="text-sm text-muted-foreground">
                                {new Date(user.created_at).toLocaleDateString()}
                              </span>
                            </td>

                            <td className="p-4">
                              <div className="flex items-center justify-end gap-2">
                                <Dialog open={editUserOpen && selectedUser?.id === user.id} onOpenChange={setEditUserOpen}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openEditRole(user)}
                                    >
                                      <Edit size={16} />
                                    </Button>
                                  </DialogTrigger>

                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit User Role</DialogTitle>
                                    </DialogHeader>

                                    <div className="space-y-4">
                                      <div>
                                        <p className="text-sm text-muted-foreground mb-2">
                                          User: <span className="font-medium text-foreground">{selectedUser?.name}</span>
                                        </p>
                                      </div>

                                      <div className="space-y-2">
                                        <p className="text-sm font-medium">Select Role</p>
                                        <Select value={newRole} onValueChange={setNewRole}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="student">Student</SelectItem>
                                            <SelectItem value="instructor">Instructor</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <Button
                                        className="w-full"
                                        onClick={() => {
                                          if (!selectedUser) return;
                                          updateUserRole.mutate({
                                            userId: selectedUser.id,
                                            role: newRole,
                                          });
                                        }}
                                        disabled={updateUserRole.isPending}
                                      >
                                        {updateUserRole.isPending ? "Saving..." : "Save Role"}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm(`Delete ${user.display_name}? This cannot be undone.`)) {
                                      deleteUser.mutate(user.id);
                                    }
                                  }}
                                  disabled={deleteUser.isPending}
                                >
                                  <Trash2 size={16} className="text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* CONTENT TAB */}
      {tab === "content" && (
        <div className="space-y-6">
          {(coursesError || quizzesError) && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                {coursesError && <p className="text-destructive text-sm">Courses error: {coursesError}</p>}
                {quizzesError && <p className="text-destructive text-sm">Quizzes error: {quizzesError}</p>}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Courses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap size={18} />
                  Courses ({courses.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {courses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No courses found.</p>
                ) : (
                  courses.slice(0, 8).map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {course.topic} • {course.difficulty} •{" "}
                          {course.profiles?.[0]?.display_name || "Unknown"}
                        </p>
                      </div>
                      <Badge variant={course.is_published ? "default" : "outline"}>
                        {course.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quizzes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen size={18} />
                  Quizzes ({quizzes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quizzes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No quizzes found.</p>
                ) : (
                  quizzes.slice(0, 8).map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{quiz.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {quiz.topic} • {quiz.difficulty} • {Array.isArray(quiz.questions) ? quiz.questions.length : 0} Qs •{" "}
                          {quiz.profiles?.[0]?.display_name || "Unknown"}
                        </p>
                      </div>
                      <Badge variant={quiz.is_published ? "default" : "outline"}>
                        {quiz.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}