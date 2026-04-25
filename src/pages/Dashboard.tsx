import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageLoader from "@/components/PageLoader";
import { fetchDashboardData } from "@/lib/api";
import {
  Flame,
  Zap,
  TrendingUp,
  GraduationCap,
  ChevronRight,
  BookOpen,
  Brain,
  BarChart3,
  Clock3,
  Target,
} from "lucide-react";

interface CourseRow {
  id: string;
  title: string;
  description: string | null;
  topic: string | null;
  difficulty: string | null;
  is_published: boolean;
}

const difficultyStyles: Record<string, string> = {
  easy: "text-mastery bg-mastery/10 border-mastery/20",
  medium: "text-accent bg-accent/10 border-accent/20",
  hard: "text-destructive bg-destructive/10 border-destructive/20",
};

const Dashboard = () => {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    retry: 1,
  });

  const {
    data: courses = [],
    isLoading: coursesLoading,
  } = useQuery({
    queryKey: ["dashboard-featured-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, topic, difficulty, is_published")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) {
        console.error("DASHBOARD COURSES ERROR:", error);
        throw error;
      }

      return (data || []) as CourseRow[];
    },
    retry: 1,
  });

  if (isLoading) return <PageLoader />;

  if (error || !data) {
    return (
      <div className="bg-card-gradient border border-border rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Dashboard unavailable</h2>
        <p className="text-sm text-muted-foreground">
          Unable to load dashboard data right now.
        </p>
      </div>
    );
  }

  const { profile } = data;

  const firstName = profile?.name?.split(" ")[0] || "Learner";

  const quickActions = [
    {
      title: "Browse Courses",
      desc: "Explore all available learning paths",
      icon: GraduationCap,
      path: "/courses",
    },
    {
      title: "Take Quiz",
      desc: "Test your understanding",
      icon: BookOpen,
      path: "/quizzes",
    },
    {
      title: "AI Tutor",
      desc: "Ask doubts and get help instantly",
      icon: Brain,
      path: "/tutor",
    },
    {
      title: "Analytics",
      desc: "Track your performance and growth",
      icon: BarChart3,
      path: "/analytics",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card-gradient border border-border rounded-2xl p-6 md:p-7"
      >
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Stay consistent. Focus on one course, revise regularly, and keep your streak alive.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-full xl:min-w-[460px]">
            <div className="rounded-xl border border-accent/20 bg-accent/10 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Flame size={16} className="text-accent" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Streak
                </span>
              </div>
              <p className="text-xl font-bold text-accent">{profile.streak} days</p>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} className="text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Level
                </span>
              </div>
              <p className="text-xl font-bold text-primary">Lv. {profile.level}</p>
            </div>

            <div className="rounded-xl border border-mastery/20 bg-mastery/10 p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-mastery" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Skill
                </span>
              </div>
              <p className="text-xl font-bold text-mastery">{profile.skillRating}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {quickActions.map((action, i) => (
          <motion.button
            key={action.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(action.path)}
            className="text-left bg-card-gradient border border-border rounded-2xl p-5 hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <action.icon size={18} className="text-primary" />
              <ChevronRight size={14} className="text-muted-foreground" />
            </div>

            <h3 className="text-sm font-semibold text-foreground">{action.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{action.desc}</p>
          </motion.button>
        ))}
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_0.9fr] gap-6">
        {/* Left: Featured Courses */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card-gradient border border-border rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Featured Courses</h2>
            </div>

            <button
              onClick={() => navigate("/courses")}
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              View all
            </button>
          </div>

          {coursesLoading ? (
            <p className="text-sm text-muted-foreground">Loading courses...</p>
          ) : courses.length === 0 ? (
            <div className="rounded-xl border border-border bg-secondary/20 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No published courses available yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-xl border border-border bg-secondary/20 p-4 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs text-muted-foreground truncate">
                      {course.topic || "General"}
                    </span>

                    <span
                      className={`text-[10px] px-2 py-1 rounded-full border capitalize ${
                        difficultyStyles[(course.difficulty || "").toLowerCase()] ||
                        "text-primary bg-primary/10 border-primary/20"
                      }`}
                    >
                      {course.difficulty || "standard"}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-2 min-h-[40px]">
                    {course.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-3 mb-4 min-h-[48px]">
                    {course.description || "No description available for this course yet."}
                  </p>

                  <button
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition text-xs font-semibold"
                  >
                    Open Course
                    <ChevronRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Right: Focus Panel */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="bg-card-gradient border border-border rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Target size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Today’s Focus</h3>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <p className="text-xs text-muted-foreground mb-1">Primary Goal</p>
                <p className="text-sm font-medium text-foreground">
                  Continue one course and complete one focused session.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <p className="text-xs text-muted-foreground mb-1">Best Practice</p>
                <p className="text-sm font-medium text-foreground">
                  Study first, then attempt quizzes for retention.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <p className="text-xs text-muted-foreground mb-1">Recommended Duration</p>
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock3 size={14} className="text-accent" />
                  30–45 minutes focused session
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card-gradient border border-border rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-foreground mb-4">Progress Snapshot</h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Level Progress</span>
                  <span className="font-mono text-primary">
                    {profile.xp} / {profile.xpToNext} XP
                  </span>
                </div>

                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-neural rounded-full"
                    style={{
                      width: `${
profile.xpToNext
  ? Math.min((profile.xp / profile.xpToNext) * 100, 100)
  : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Streak
                  </p>
                  <p className="text-lg font-bold text-accent mt-1">{profile.streak}</p>
                </div>

                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Skill
                  </p>
                  <p className="text-lg font-bold text-mastery mt-1">{profile.skillRating}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;