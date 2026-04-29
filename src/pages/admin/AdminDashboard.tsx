import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Activity,
  FileText,
  Settings,
  LayoutDashboard,
  Database,
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

type RoleFilter = "all" | "admin" | "instructor" | "student";
type AdminSection = "overview" | "users" | "courses" | "quizzes" | "logs" | "settings";

export default function AdminDashboard() {
  const qc = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const [editUserOpen, setEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    role: string;
  } | null>(null);
  const [newRole, setNewRole] = useState<string>("student");

  const currentSection: AdminSection = useMemo(() => {
    if (location.pathname === "/admin") return "overview";
    if (location.pathname.startsWith("/admin/users")) return "users";
    if (location.pathname.startsWith("/admin/courses")) return "courses";
    if (location.pathname.startsWith("/admin/quizzes")) return "quizzes";
    if (location.pathname.startsWith("/admin/logs")) return "logs";
    if (location.pathname.startsWith("/admin/settings")) return "settings";
    return "overview";
  }, [location.pathname]);

  const sectionMeta = {
    overview: {
      title: "Platform Overview",
      description: "Monitor platform health, content quality, and operational signals",
      icon: LayoutDashboard,
    },
    users: {
      title: "User Management",
      description: "Review users, roles, and access governance",
      icon: Users,
    },
    courses: {
      title: "Course Governance",
      description: "Audit published and draft learning content",
      icon: GraduationCap,
    },
    quizzes: {
      title: "Quiz Governance",
      description: "Validate quiz quality, publish state, and question completeness",
      icon: BookOpen,
    },
    logs: {
      title: "System Logs",
      description: "Track sensitive admin and moderation operations",
      icon: Activity,
    },
    settings: {
      title: "Platform Settings",
      description: "Control platform policy, defaults, and governance rules",
      icon: Settings,
    },
  } as const;

  const activeMeta = sectionMeta[currentSection];

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
          role: (roleRecord?.role || "student") as "admin" | "instructor" | "student",
        };
      });
    },
    retry: 1,
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery<CourseItem[]>({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as CourseItem[]) || [];
    },
    retry: 1,
  });

  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery<QuizItem[]>({
    queryKey: ["admin-quizzes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as QuizItem[]) || [];
    },
    retry: 1,
  });

  const metrics = useMemo(() => {
    const totalUsers = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const instructors = users.filter((u) => u.role === "instructor").length;
    const students = users.filter((u) => (u.role || "student") === "student").length;

    const totalCourses = courses.length;
    const publishedCourses = courses.filter((c) => c.is_published).length;
    const draftCourses = totalCourses - publishedCourses;

    const totalQuizzes = quizzes.length;
    const publishedQuizzes = quizzes.filter((q) => q.is_published).length;
    const draftQuizzes = totalQuizzes - publishedQuizzes;

    const quizzesWithoutQuestions = quizzes.filter(
      (q) => !Array.isArray(q.questions) || q.questions.length === 0
    ).length;

    return {
      totalUsers,
      admins,
      instructors,
      students,
      totalCourses,
      publishedCourses,
      draftCourses,
      totalQuizzes,
      publishedQuizzes,
      draftQuizzes,
      quizzesWithoutQuestions,
      totalIssues: quizzesWithoutQuestions + draftCourses + draftQuizzes,
    };
  }, [users, courses, quizzes]);

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

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        roleFilter === "all" ? true : (u.role || "student") === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const getRoleBadgeVariant = (role?: string) => {
    if (role === "admin") return "default";
    if (role === "instructor") return "secondary";
    return "outline";
  };

  const getStatusBadge = (published: boolean) => {
    return published ? "default" : "outline";
  };

  const renderOverview = () => {
    const isLoading = usersLoading || coursesLoading || quizzesLoading;

    if (isLoading) {
      return <div className="text-sm text-muted-foreground">Loading platform overview...</div>;
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Users</p>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-bold">{metrics.totalUsers}</p>
              <p className="text-xs text-muted-foreground">{metrics.students} students</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Admins</p>
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-bold">{metrics.admins}</p>
              <p className="text-xs text-muted-foreground">Privileged users</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Instructors</p>
                <UserCog className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-bold">{metrics.instructors}</p>
              <p className="text-xs text-muted-foreground">Course creators</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Courses</p>
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-bold">{metrics.totalCourses}</p>
              <p className="text-xs text-muted-foreground">{metrics.draftCourses} drafts</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Quizzes</p>
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-bold">{metrics.totalQuizzes}</p>
              <p className="text-xs text-muted-foreground">{metrics.draftQuizzes} drafts</p>
            </CardContent>
          </Card>

          <Card className="border-orange-500/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Attention</p>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </div>
              <p className="mt-2 text-2xl font-bold">{metrics.totalIssues}</p>
              <p className="text-xs text-muted-foreground">Pending issues</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Needs Attention</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-orange-500" />
                  <p className="font-medium">Draft Courses</p>
                </div>
                <p className="mt-2 text-2xl font-bold">{metrics.draftCourses}</p>
                <p className="text-xs text-muted-foreground">Courses not yet published</p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-orange-500" />
                  <p className="font-medium">Draft Quizzes</p>
                </div>
                <p className="mt-2 text-2xl font-bold">{metrics.draftQuizzes}</p>
                <p className="text-xs text-muted-foreground">Quizzes not yet published</p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <p className="font-medium">Empty Quizzes</p>
                </div>
                <p className="mt-2 text-2xl font-bold">{metrics.quizzesWithoutQuestions}</p>
                <p className="text-xs text-muted-foreground">Quizzes with zero questions</p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <p className="font-medium">Published Content</p>
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {metrics.publishedCourses + metrics.publishedQuizzes}
                </p>
                <p className="text-xs text-muted-foreground">Live content available to learners</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button variant="outline" onClick={() => navigate("/admin/users")}>
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
              <Button variant="outline" onClick={() => navigate("/admin/courses")}>
                <GraduationCap className="mr-2 h-4 w-4" />
                Review Courses
              </Button>
              <Button variant="outline" onClick={() => navigate("/admin/quizzes")}>
                <BookOpen className="mr-2 h-4 w-4" />
                Review Quizzes
              </Button>
              <Button variant="outline" onClick={() => navigate("/admin/logs")}>
                <Activity className="mr-2 h-4 w-4" />
                Activity Logs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    if (usersLoading) {
      return <div className="text-sm text-muted-foreground">Loading users...</div>;
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
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

          <div className="w-full max-w-[220px]">
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as RoleFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Management ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">User</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Role</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Level</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">XP</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Joined</th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
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
                          <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                        </div>
                      </td>

                      <td className="p-4">
                        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                      </td>

                      <td className="p-4">
                        <Badge variant="outline">Lvl {user.level}</Badge>
                      </td>

                      <td className="p-4">{user.xp}</td>

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
                                confirm(`Delete ${user.display_name}? This cannot be undone.`)
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

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-sm text-muted-foreground"
                      >
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCourses = () => {
    if (coursesLoading) {
      return <div className="text-sm text-muted-foreground">Loading courses...</div>;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Course Management ({courses.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Title</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Topic</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Difficulty</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Created</th>
                  <th className="p-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr
                    key={course.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4 font-medium">{course.title}</td>
                    <td className="p-4">{course.topic}</td>
                    <td className="p-4">{course.difficulty}</td>
                    <td className="p-4">
                      <Badge variant={getStatusBadge(course.is_published)}>
                        {course.is_published ? "Published" : "Draft"}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(course.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" disabled>
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" disabled>
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {courses.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-sm text-muted-foreground"
                    >
                      No courses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderQuizzes = () => {
    if (quizzesLoading) {
      return <div className="text-sm text-muted-foreground">Loading quizzes...</div>;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quiz Management ({quizzes.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Title</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Topic</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Difficulty</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Questions</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Created</th>
                  <th className="p-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz) => {
                  const qCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0;

                  return (
                    <tr
                      key={quiz.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4 font-medium">{quiz.title}</td>
                      <td className="p-4">{quiz.topic}</td>
                      <td className="p-4">{quiz.difficulty}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span>{qCount}</span>
                          {qCount === 0 && <Badge variant="destructive">Empty</Badge>}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getStatusBadge(quiz.is_published)}>
                          {quiz.is_published ? "Published" : "Draft"}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(quiz.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" disabled>
                            <Edit size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" disabled>
                            <Trash2 size={16} className="text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {quizzes.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-sm text-muted-foreground"
                    >
                      No quizzes found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLogs = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border p-4 flex items-start gap-3">
            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">Activity logs module</p>
              <p className="text-sm text-muted-foreground">
                Next step: create an <code>admin_activity_logs</code> table and load
                recent admin actions here.
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4 flex items-start gap-3">
            <Activity className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">Recommended tracked actions</p>
              <p className="text-sm text-muted-foreground">
                user_deleted, role_changed, course_updated, course_published,
                quiz_updated, quiz_published
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSettings = () => {
    return (
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border p-4">
              <p className="font-medium">Role Governance</p>
              <p className="text-sm text-muted-foreground mt-1">
                Only backend-validated admin functions should change roles or delete users.
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="font-medium">Content Moderation</p>
              <p className="text-sm text-muted-foreground mt-1">
                Publishing should require validation: non-empty title, topic, difficulty, and content.
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="font-medium">Quiz Integrity</p>
              <p className="text-sm text-muted-foreground mt-1">
                Final scoring must move to Supabase Edge Functions / RPC. Never trust frontend scoring.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Backend Architecture Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border p-4 flex items-start gap-3">
              <Database className="h-4 w-4 mt-0.5 text-primary" />
              <div>
                <p className="font-medium">Supabase BaaS</p>
                <p className="text-sm text-muted-foreground">
                  Use RLS + Edge Functions for all privileged admin operations.
                </p>
              </div>
            </div>

            <div className="rounded-xl border p-4 flex items-start gap-3">
              <Shield className="h-4 w-4 mt-0.5 text-primary" />
              <div>
                <p className="font-medium">Security Priority</p>
                <p className="text-sm text-muted-foreground">
                  Role checks in React are UX only. Real authorization must live in Supabase.
                </p>
              </div>
            </div>

            <div className="rounded-xl border p-4 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-500" />
              <div>
                <p className="font-medium">Current Refactor Priority</p>
                <p className="text-sm text-muted-foreground">
                  Split admin pages into dedicated route-based modules next. This single file is temporary.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <activeMeta.icon className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">{activeMeta.title}</h1>
            <p className="text-sm text-muted-foreground">{activeMeta.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={currentSection === "overview" ? "default" : "outline"}
            onClick={() => navigate("/admin")}
          >
            Overview
          </Button>
          <Button
            variant={currentSection === "users" ? "default" : "outline"}
            onClick={() => navigate("/admin/users")}
          >
            Users
          </Button>
          <Button
            variant={currentSection === "courses" ? "default" : "outline"}
            onClick={() => navigate("/admin/courses")}
          >
            Courses
          </Button>
          <Button
            variant={currentSection === "quizzes" ? "default" : "outline"}
            onClick={() => navigate("/admin/quizzes")}
          >
            Quizzes
          </Button>
          <Button
            variant={currentSection === "logs" ? "default" : "outline"}
            onClick={() => navigate("/admin/logs")}
          >
            Logs
          </Button>
          <Button
            variant={currentSection === "settings" ? "default" : "outline"}
            onClick={() => navigate("/admin/settings")}
          >
            Settings
          </Button>
        </div>
      </div>

      {currentSection === "overview" && renderOverview()}
      {currentSection === "users" && renderUsers()}
      {currentSection === "courses" && renderCourses()}
      {currentSection === "quizzes" && renderQuizzes()}
      {currentSection === "logs" && renderLogs()}
      {currentSection === "settings" && renderSettings()}
    </div>
  );
}