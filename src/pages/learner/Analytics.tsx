import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Download,
  TrendingDown,
  Target,
  Clock,
  BarChart3,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PageLoader from "@/components/PageLoader";

type QuizAttempt = {
  id: string;
  score: number;
  correct_answers: number | null;
  total_questions: number | null;
  topic: string | null;
  difficulty: string | null;
  user_id: string;
};

const ts = {
  background: "hsl(222, 25%, 13%)",
  border: "1px solid hsl(222, 20%, 22%)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(210, 20%, 85%)",
};

const PIE_COLORS = [
  "hsl(150, 60%, 50%)",
  "hsl(38, 90%, 55%)",
  "hsl(0, 72%, 55%)",
];

const Analytics = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["real-analytics-page"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated");

      const [{ data: attempts, error: attemptsError }, { data: profile, error: profileError }] =
        await Promise.all([
          supabase
            .from("quiz_attempts")
            .select("*")
            .eq("user_id", user.id)
            .order("id", { ascending: true }),

          supabase
            .from("profiles")
            .select("display_name, level, xp, xp_to_next")
            .eq("id", user.id)
            .maybeSingle(),
        ]);

      if (attemptsError) throw attemptsError;
      if (profileError) throw profileError;

      return {
        attempts: (attempts || []) as QuizAttempt[],
        profile: profile || null,
      };
    },
    retry: 1,
  });

  const attempts = data?.attempts || [];
  const profile = data?.profile;

  const topicPerformance = useMemo(() => {
    const map = new Map<
      string,
      {
        topic: string;
        totalScore: number;
        attempts: number;
        totalQuestions: number;
      }
    >();

    attempts.forEach((attempt) => {
      const topic = attempt.topic || "General";
      const score = Number(attempt.score || 0);
      const totalQuestions = Number(attempt.total_questions || 0);

      if (!map.has(topic)) {
        map.set(topic, {
          topic,
          totalScore: score,
          attempts: 1,
          totalQuestions,
        });
      } else {
        const current = map.get(topic)!;
        current.totalScore += score;
        current.attempts += 1;
        current.totalQuestions += totalQuestions;
      }
    });

    return Array.from(map.values()).map((item) => {
      const avgScore = Math.round(item.totalScore / item.attempts);
      return {
        topic: item.topic,
        accuracy: avgScore,
        mastery: avgScore,
        attempts: item.attempts,
        timeSpent: item.totalQuestions * 2, // estimated 2 min per question
      };
    });
  }, [attempts]);

  const weakAreas = topicPerformance.filter((t) => t.mastery < 40);

  const performanceTrend = useMemo(() => {
    return attempts.map((attempt, index) => ({
      name: `#${index + 1}`,
      score: Number(attempt.score || 0),
    }));
  }, [attempts]);

  const difficultyBreakdown = useMemo(() => {
    const counts = { easy: 0, medium: 0, hard: 0 };

    attempts.forEach((attempt) => {
      const difficulty = (attempt.difficulty || "").toLowerCase();
      if (difficulty === "easy") counts.easy += 1;
      else if (difficulty === "medium") counts.medium += 1;
      else if (difficulty === "hard") counts.hard += 1;
    });

    return [
      { name: "Easy", value: counts.easy },
      { name: "Medium", value: counts.medium },
      { name: "Hard", value: counts.hard },
    ].filter((item) => item.value > 0);
  }, [attempts]);

  const avgAccuracy = useMemo(() => {
    if (!attempts.length) return 0;
    const total = attempts.reduce((sum, a) => sum + Number(a.score || 0), 0);
    return Math.round(total / attempts.length);
  }, [attempts]);

  const totalStudyTime = useMemo(() => {
    return topicPerformance.reduce((sum, t) => sum + t.timeSpent, 0);
  }, [topicPerformance]);

  const bestScore = useMemo(() => {
    if (!attempts.length) return 0;
    return Math.max(...attempts.map((a) => Number(a.score || 0)));
  }, [attempts]);

  const handleExportJSON = useCallback(() => {
    if (!data) return;

    const report = {
      exportedAt: new Date().toISOString(),
      student: {
        name: profile?.display_name || "Learner",
        level: profile?.level || 1,
        xp: profile?.xp || 0,
        xpToNext: profile?.xp_to_next || 100,
      },
      summary: {
        totalAttempts: attempts.length,
        avgAccuracy,
        bestScore,
        totalStudyTimeMinutes: totalStudyTime,
      },
      topicPerformance,
      performanceTrend,
      difficultyBreakdown,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cogniflow-report-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Report exported as JSON!");
  }, [data, profile, attempts, avgAccuracy, bestScore, totalStudyTime, topicPerformance, performanceTrend, difficultyBreakdown]);

  if (isLoading) return <PageLoader rows={5} />;

  if (error) {
    return (
      <div className="bg-card-gradient border border-border rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Analytics unavailable</h2>
        <p className="text-sm text-muted-foreground">
          Could not load real analytics data.
        </p>
      </div>
    );
  }

  if (!attempts.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real performance insights from quiz attempts
            </p>
          </div>
        </div>

        <div className="bg-card-gradient border border-border rounded-xl p-8 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">No quiz attempts yet</h3>
          <p className="text-sm text-muted-foreground">
            Attempt quizzes first to unlock real analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real performance insights from quiz attempts
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-neural text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
        >
          <Download size={14} /> Export JSON
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Avg Accuracy",
            value: `${avgAccuracy}%`,
            icon: Target,
            color: "text-primary",
          },
          {
            label: "Study Time",
            value: `${(totalStudyTime / 60).toFixed(1)}h`,
            icon: Clock,
            color: "text-accent",
          },
          {
            label: "Weak Areas",
            value: String(weakAreas.length),
            icon: TrendingDown,
            color: "text-destructive",
          },
          {
            label: "Best Score",
            value: `${bestScore}%`,
            icon: Trophy,
            color: "text-mastery",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card-gradient border border-border rounded-xl p-4"
          >
            <s.icon size={18} className={`${s.color} mb-2`} />
            <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card-gradient border border-border rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Topic-wise Accuracy
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topicPerformance} layout="vertical" margin={{ left: 80 }}>
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="topic"
                tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={ts} />
              <Bar dataKey="accuracy" fill="hsl(185, 70%, 50%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card-gradient border border-border rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Difficulty Breakdown
          </h3>

          {difficultyBreakdown.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
              No difficulty data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={difficultyBreakdown}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={85}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {difficultyBreakdown.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={ts} />
              </PieChart>
            </ResponsiveContainer>
          )}

          <div className="mt-4 space-y-2">
            {difficultyBreakdown.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-foreground font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-card-gradient border border-border rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Quiz Performance Trend
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={performanceTrend}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={ts} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(340, 70%, 55%)"
                strokeWidth={2}
                dot={{ fill: "hsl(340, 70%, 55%)", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-card-gradient border border-border rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Estimated Time per Topic (min)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topicPerformance}>
              <XAxis
                dataKey="topic"
                tick={{ fontSize: 9, fill: "hsl(215, 15%, 55%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={ts} />
              <Bar
                dataKey="timeSpent"
                fill="hsl(38, 90%, 55%)"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {weakAreas.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-card-gradient border border-destructive/20 rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            ⚠️ Weak Areas (Mastery &lt; 40%)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {weakAreas.map((t) => (
              <div
                key={t.topic}
                className="p-3 rounded-lg border border-destructive/20 bg-destructive/5"
              >
                <p className="text-sm font-medium text-foreground">{t.topic}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-destructive rounded-full"
                      style={{ width: `${t.mastery}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-destructive">{t.mastery}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Analytics;