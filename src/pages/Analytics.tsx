import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { Download, TrendingDown, Target, Clock, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useCallback } from "react";
import { fetchAnalyticsPageData } from "@/lib/api";
import PageLoader from "@/components/PageLoader";

const ts = { background: "hsl(222, 25%, 13%)", border: "1px solid hsl(222, 20%, 22%)", borderRadius: "8px", fontSize: "12px", color: "hsl(210, 20%, 85%)" };

const Analytics = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-page"],
    queryFn: fetchAnalyticsPageData,
  });

  const handleExportJSON = useCallback(() => {
    if (!data) return;
    const report = {
      exportedAt: new Date().toISOString(),
      student: {
        name: data.profile.name,
        level: data.profile.level,
        xp: data.profile.xp,
        skillRating: data.profile.skillRating,
        streak: data.profile.streak,
      },
      cognitiveProfile: {
        traits: data.cognitiveTraits,
        efficiency: data.cognitiveEfficiency,
      },
      quizPerformance: data.quizzes.map((q) => ({
        title: q.title,
        topic: q.topic,
        difficulty: q.difficulty,
        bestScore: q.bestScore,
        attempts: q.attempts,
      })),
      masteryScores: data.topicNodes.map((n) => ({
        id: n.id,
        label: n.label,
        mastery: n.mastery,
      })),
      topicPerformance: data.topicPerformance,
      weeklyProgress: data.weeklyProgress,
      ratingHistory: data.ratingHistory,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cogniflow-report-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported as JSON!");
  }, [data]);

  if (isLoading || !data) return <PageLoader rows={5} />;

  const { topicPerformance, focusTimeline, weeklyProgress } = data;
  const weakAreas = topicPerformance.filter((t) => t.mastery < 40);
  const radarData = topicPerformance.map((t) => ({ subject: t.topic, A: t.mastery }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Detailed performance insights across all topics</p>
        </div>
        <button onClick={handleExportJSON}
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-neural text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
          <Download size={14} /> Export JSON
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Avg Accuracy", value: `${Math.round(topicPerformance.reduce((a, t) => a + t.accuracy, 0) / topicPerformance.length)}%`, icon: Target, color: "text-primary" },
          { label: "Total Study Time", value: `${(topicPerformance.reduce((a, t) => a + t.timeSpent, 0) / 60).toFixed(1)}h`, icon: Clock, color: "text-accent" },
          { label: "Weak Areas", value: String(weakAreas.length), icon: TrendingDown, color: "text-destructive" },
          { label: "Topics Covered", value: String(topicPerformance.length), icon: BarChart3, color: "text-mastery" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card-gradient border border-border rounded-xl p-4">
            <s.icon size={18} className={`${s.color} mb-2`} />
            <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-card-gradient border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Topic-wise Accuracy</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topicPerformance} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="topic" tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={ts} />
              <Bar dataKey="accuracy" fill="hsl(185, 70%, 50%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="bg-card-gradient border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Mastery Radar</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(222, 20%, 22%)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="A" fill="hsl(260, 60%, 60%)" fillOpacity={0.3} stroke="hsl(260, 60%, 60%)" strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="bg-card-gradient border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Focus Drop Timeline</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={focusTimeline}>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={ts} />
              <Line type="monotone" dataKey="focus" stroke="hsl(340, 70%, 55%)" strokeWidth={2} dot={{ fill: "hsl(340, 70%, 55%)", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="bg-card-gradient border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Time Spent per Topic (min)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topicPerformance}>
              <XAxis dataKey="topic" tick={{ fontSize: 9, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={ts} />
              <Bar dataKey="timeSpent" fill="hsl(38, 90%, 55%)" radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {weakAreas.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="bg-card-gradient border border-destructive/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">⚠️ Weak Areas (Mastery &lt; 40%)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {weakAreas.map((t) => (
              <div key={t.topic} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                <p className="text-sm font-medium text-foreground">{t.topic}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-destructive rounded-full" style={{ width: `${t.mastery}%` }} />
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
