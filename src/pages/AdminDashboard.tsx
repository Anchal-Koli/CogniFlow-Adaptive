import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users,
  BookOpen,
  GraduationCap,
  Search,
  Trash2,
  Edit,
  UserCog,
  Shield,
  Settings2,
} from "lucide-react";

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
  publishedCourses: number;
  totalQuizzes: number;
  publishedQuizzes: number;
}

interface CourseItem {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  is_published: boolean;
  created_at: string;
  created_by: string | null;
}

interface QuizItem {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  is_published: boolean;
  created_at: string;
  created_by: string | null;
  questions: unknown[] | null;
}

export default function AdminDashboard() {
  const qc = useQueryClient();

  const [tab, setTab] = useState<"overview" | "users" | "content">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    role: string;
  } | null>(null);
  const [newRole, setNewRole] = useState<string>("student");

  // -----------------------------
  // Overview Stats
  // -----------------------------
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        usersRes,
        totalCoursesRes,
        publishedCoursesRes,
        totalQuizzesRes,
        publishedQuizzesRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase
          .from("courses")
          .select("id", { count: "exact", head: true })
          .eq("is_published", true),
        supabase.from("quizzes").select("id", { count: "exact", head: true }),
        supabase
          .from("quizzes")
          .select("id", { count: "exact", head: true })
          .eq("is_published", true),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (totalCoursesRes.error) throw totalCoursesRes.error;
      if (publishedCoursesRes.error) throw publishedCoursesRes.error;
      if (totalQuizzesRes.error) throw totalQuizzesRes.error;
      if (publishedQuizzesRes.error) throw publishedQuizzesRes.error;

      return {
        totalUsers: usersRes.count || 0,
        totalCourses: totalCoursesRes.count || 0,
        publishedCourses: publishedCoursesRes.count || 0,
        totalQuizzes: totalQuizzesRes.count || 0,
        publishedQuizzes: publishedQuizzesRes.count || 0,
      };
    },
    retry: 1,
  });

  // -----------------------------
  // Users (profiles + roles + auth users via edge function)
  // -----------------------------
  const { data: users = [], isLoading: usersLoading } = useQuery<UserProfile[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const { data: usersResponse, error: usersFnError } =
        await supabase.functions.invoke("admin-users", {
          body: { action: "listUsers" },
        });

      if (usersFnError) {
        console.error("admin-users function error:", usersFnError);
      }

      const authUsers = usersResponse?.users || [];

      return (profiles || []).map((profile) => {
        const roleRecord = roles?.find(
          (r: { user_id: string; role: string }) => r.user_id === profile.id
        );
        const authUser = authUsers.find(
          (u: { id: string; email?: string }) => u.id === profile.id
        );

        return {
          ...profile,
          email: authUser?.email || null,
          role: (roleRecord?.role || "student") as
            | "admin"
            | "instructor"
            | "student",
        };
      });
    },
    retry: 1,
  });

  // -----------------------------
  // Courses (simple query only)
  // -----------------------------
  const { data: courses = [], isLoading: coursesLoading } = useQuery<CourseItem[]>({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("ADMIN COURSES ERROR:", error);
        throw error;
      }

      console.log("ADMIN COURSES DATA:", data);
      return (data as CourseItem[]) || [];
    },
    retry: 1,
  });

  // -----------------------------
  // Quizzes (simple query only)
  // -----------------------------
  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery<QuizItem[]>({
    queryKey: ["admin-quizzes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("ADMIN QUIZZES ERROR:", error);
        throw error;
      }

      console.log("ADMIN QUIZZES DATA:", data);
      return (data as QuizItem[]) || [];
    },
    retry: 1,
  });

  // -----------------------------
  // Update User Role
  // -----------------------------
  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError && !deleteError.message.includes("No rows")) {
        throw deleteError;
      }

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
      setNewRole("student");
      toast.success("User role updated");
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  // -----------------------------
  // Delete User
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
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">
          Manage users, courses and quizzes
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(["overview", "users", "content"] as const).map((t) => (
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

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="text-sm text-muted-foreground">Loading overview...</div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Users</p>
                      <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                    </div>
                    <Users className="text-primary" size={22} />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Courses</p>
                      <p className="text-2xl font-bold">{stats?.totalCourses || 0}</p>
                      <p className="text-xs text-muted-foreground">
                        {stats?.publishedCourses || 0} published
                      </p>
                    </div>
                    <GraduationCap className="text-primary" size={22} />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Quizzes</p>
                      <p className="text-2xl font-bold">{stats?.totalQuizzes || 0}</p>
                      <p className="text-xs text-muted-foreground">
                        {stats?.publishedQuizzes || 0} published
                      </p>
                    </div>
                    <BookOpen className="text-primary" size={22} />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">System Role</p>
                      <p className="text-2xl font-bold">Admin</p>
                      <p className="text-xs text-muted-foreground">Full access</p>
                    </div>
                    <Shield className="text-primary" size={22} />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Courses</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {coursesLoading ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : courses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No courses found.</p>
                    ) : (
                      courses.slice(0, 5).map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center justify-between border rounded-lg p-3"
                        >
                          <div className="min-w-0">
                            <p className="font-medium truncate">{course.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {course.topic} • {course.difficulty}
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

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Quizzes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quizzesLoading ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : quizzes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No quizzes found.</p>
                    ) : (
                      quizzes.slice(0, 5).map((quiz) => (
                        <div
                          key={quiz.id}
                          className="flex items-center justify-between border rounded-lg p-3"
                        >
                          <div className="min-w-0">
                            <p className="font-medium truncate">{quiz.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {quiz.topic} • {quiz.difficulty} •{" "}
                              {Array.isArray(quiz.questions) ? quiz.questions.length : 0} Qs
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <Button
                    variant="outline"
                    onClick={() => setTab("users")}
                    className="h-16"
                  >
                    <UserCog className="mr-2" size={18} />
                    Manage Users
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setTab("content")}
                    className="h-16"
                  >
                    <Settings2 className="mr-2" size={18} />
                    Manage Content
                  </Button>

                  <Button variant="outline" className="h-16" disabled>
                    <Shield className="mr-2" size={18} />
                    System Settings
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* USERS */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {usersLoading ? (
            <div className="text-sm text-muted-foreground">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No users found
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border bg-muted/50">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                          User
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                          Level
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                          Role
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                          Joined
                        </th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-border hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{user.display_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {user.email || "No email"}
                              </p>
                            </div>
                          </td>

                          <td className="p-4">
                            <Badge variant="outline">Lvl {user.level}</Badge>
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
                              <Dialog
                                open={editUserOpen && selectedUser?.id === user.id}
                                onOpenChange={setEditUserOpen}
                              >
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
                                    <p className="text-sm text-muted-foreground">
                                      User:{" "}
                                      <span className="font-medium text-foreground">
                                        {selectedUser?.name}
                                      </span>
                                    </p>

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
                                  if (
                                    confirm(
                                      `Delete ${user.display_name}? This cannot be undone.`
                                    )
                                  ) {
                                    deleteUser.mutate(user.id);
                                  }
                                }}
                                disabled={deleteUser.isPending}
                              >
                                <Trash2 size={16} className="text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* CONTENT */}
      {tab === "content" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Courses ({courses.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {coursesLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : courses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No courses found.</p>
              ) : (
                courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{course.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {course.topic} • {course.difficulty}
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quizzes ({quizzes.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quizzesLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : quizzes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No quizzes found.</p>
              ) : (
                quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{quiz.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {quiz.topic} • {quiz.difficulty} •{" "}
                        {Array.isArray(quiz.questions) ? quiz.questions.length : 0} Qs
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
      )}
    </div>
  );
}