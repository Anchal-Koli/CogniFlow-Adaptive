import { useMemo } from "react";
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
  Sparkles,
  AlertTriangle,
} from "lucide-react";

interface CourseRow {
  id: string;
  title: string;
  description: string | null;
  topic: string | null;
  difficulty: string | null;
  is_published: boolean;
}

interface QuizRow {
  id: string;
  topic: string | null;
  difficulty: string | null;
}

interface QuizAttemptRow {
  id: string;
  score: number;
  user_id: string;
  quiz_id: string;
  quiz?: QuizRow | null;
}

const difficultyStyles: Record<string, string> = {
  easy: "text-mastery bg-mastery/10 border-mastery/20",
  medium: "text-accent bg-accent/10 border-accent/20",
  hard: "text-destructive bg-destructive/10 border-destructive/20",
};

const getRecommendedDifficulty = (score: number) => {
  if (score < 50) return "easy";
  if (score < 75) return "medium";
  return "hard";
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
        .limit(8);

      if (error) {
        console.error("DASHBOARD COURSES ERROR:", error);
        throw error;
      }

      return (data || []) as CourseRow[];
    },
    retry: 1,
  });

  const {
    data: attempts = [],
    isLoading: attemptsLoading,
  } = useQuery({
    queryKey: ["dashboard-quiz-attempts"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return [];

      const { data, error } = await supabase
        .from("quiz_attempts")
        .select(`
          id,
          score,
          user_id,
          quiz_id,
          quiz:quizzes (
            id,
            topic,
            difficulty
          )
        `)
        .eq("user_id", user.id)
        .order("id", { ascending: false });

      if (error) {
        console.error("DASHBOARD ATTEMPTS ERROR:", error);
        throw error;
      }

      return (data || []) as QuizAttemptRow[];
    },
    retry: 1,
  });

  const topicPerformance = useMemo(() => {
    const map = new Map<string, { topic: string; totalScore: number; count: number }>();

    attempts.forEach((attempt) => {
      const topic = attempt.quiz?.topic || "General";
      const score = Number(attempt.score || 0);

      if (!map.has(topic)) {
        map.set(topic, { topic, totalScore: score, count: 1 });
      } else {
        const current = map.get(topic)!;
        current.totalScore += score;
        current.count += 1;
      }
    });

    return Array.from(map.values())
      .map((item) => ({
        topic: item.topic,
        avgScore: Math.round(item.totalScore / item.count),
        attempts: item.count,
      }))
      .sort((a, b) => a.avgScore - b.avgScore);
  }, [attempts]);

  const weakestTopic = topicPerformance.length ? topicPerformance[0] : null;

  const recommendedDifficulty = weakestTopic
    ? getRecommendedDifficulty(weakestTopic.avgScore)
    : "easy";

  const recommendedCourse = useMemo(() => {
    if (!courses.length) return null;

    if (!weakestTopic) return courses[0] || null;

    const exactMatch = courses.find(
      (course) =>
        (course.topic || "").toLowerCase() === (weakestTopic.topic || "").toLowerCase() &&
        (course.difficulty || "").toLowerCase() === recommendedDifficulty
    );

    if (exactMatch) return exactMatch;

    const topicMatch = courses.find(
      (course) =>
        (course.topic || "").toLowerCase() === (weakestTopic.topic || "").toLowerCase()
    );

    if (topicMatch) return topicMatch;

    return courses[0] || null;
  }, [courses, weakestTopic, recommendedDifficulty]);

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
      path: "/app/courses",
    },
    {
      title: "Take Quiz",
      desc: "Test your understanding",
      icon: BookOpen,
      path: "/app/quizzes",
    },
    {
      title: "AI Tutor",
      desc: "Ask doubts and get help instantly",
      icon: Brain,
      path: "/app/tutor",
    },
    {
      title: "Analytics",
      desc: "Track your performance and growth",
      icon: BarChart3,
      path: "/app/analytics",
    },
  ];

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_0.9fr] gap-6">
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
              onClick={() => navigate("/app/courses")}
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
              {courses.slice(0, 4).map((course) => (
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
                    onClick={() => navigate(`/app/courses/${course.id}`)}
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

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="bg-card-gradient border border-border rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Recommended Next Step</h3>
            </div>

            {attemptsLoading ? (
              <p className="text-sm text-muted-foreground">Analyzing your quiz performance...</p>
            ) : attempts.length === 0 ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <p className="text-sm font-medium text-foreground">
                    No quiz attempts yet.
                  </p>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Recommended Action</p>
                  <p className="text-sm font-medium text-foreground">
                    Start with an easy quiz to unlock personalized recommendations.
                  </p>
                </div>

                <button
                  onClick={() => navigate("/app/quizzes")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
                >
                  Take First Quiz
                  <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={14} className="text-destructive" />
                    <p className="text-xs text-muted-foreground">Focus Topic</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {weakestTopic?.topic || "General"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average score: {weakestTopic?.avgScore ?? 0}%
                  </p>
                </div>

                <div className="rounded-xl border border-accent/20 bg-accent/10 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Recommended Difficulty</p>
                  <p className="text-sm font-semibold text-foreground capitalize">
                    {recommendedDifficulty}
                  </p>
                </div>

                {recommendedCourse ? (
                  <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Recommended Course</p>
                    <p className="text-sm font-semibold text-foreground">
                      {recommendedCourse.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(recommendedCourse.topic || "General")} •{" "}
                      {(recommendedCourse.difficulty || "standard").toLowerCase()}
                    </p>

                    <button
                      onClick={() => navigate(`/app/courses/${recommendedCourse.id}`)}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition text-xs font-semibold"
                    >
                      Start Recommended Course
                      <ChevronRight size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-secondary/20 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Recommended Course</p>
                    <p className="text-sm font-medium text-foreground">
                      No matching course found yet.
                    </p>
                  </div>
                )}
              </div>
            )}
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

              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                  Recommended Session
                </p>
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock3 size={14} className="text-accent" />
                  30–45 minutes focused session
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;