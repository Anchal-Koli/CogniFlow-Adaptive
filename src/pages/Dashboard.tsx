import { useQuery } from "@tanstack/react-query";
import CognitiveMetrics from "@/components/CognitiveMetrics";
import LearningStateIndicator from "@/components/LearningStateIndicator";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import AdaptiveContentFeed from "@/components/AdaptiveContentFeed";
import SessionAnalytics from "@/components/SessionAnalytics";
import CognitiveProfile from "@/components/CognitiveProfile";
import PageLoader from "@/components/PageLoader";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Flame, Zap, TrendingUp, Target, BookOpen, RotateCcw, Sparkles } from "lucide-react";
import { fetchDashboardData } from "@/lib/api";

const tooltipStyle = { background: "hsl(222, 25%, 13%)", border: "1px solid hsl(222, 20%, 22%)", borderRadius: "8px", fontSize: "12px", color: "hsl(210, 20%, 85%)" };

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
  });

  if (isLoading || !data) return <PageLoader />;

  const { profile, weeklyProgress, studyPlan } = data;

  const typeIcon: Record<string, JSX.Element> = {
    review: <RotateCcw size={14} className="text-accent shrink-0" />,
    quiz: <BookOpen size={14} className="text-primary shrink-0" />,
    new: <Sparkles size={14} className="text-mastery shrink-0" />,
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {profile.name.split(" ")[0]} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Your AI study plan is ready. Continue where you left off.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20">
            <Flame size={16} className="text-accent" />
            <span className="text-sm font-bold font-mono text-accent">{profile.streak} day streak</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <Zap size={16} className="text-primary" />
            <span className="text-sm font-bold font-mono text-primary">Lv.{profile.level}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-mastery/10 border border-mastery/20">
            <TrendingUp size={16} className="text-mastery" />
            <span className="text-sm font-bold font-mono text-mastery">{profile.skillRating} SR</span>
          </div>
        </div>
      </motion.div>

      <LearningStateIndicator />
      <CognitiveMetrics />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <SessionAnalytics />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="bg-card-gradient border border-border rounded-xl p-5 glow-neural">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground font-semibold text-sm tracking-wide uppercase">Weekly Activity</h3>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Minutes</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" /> XP</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyProgress} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="minutes" fill="hsl(185, 70%, 50%)" radius={[4, 4, 0, 0]} opacity={0.8} />
                <Bar dataKey="xp" fill="hsl(38, 90%, 55%)" radius={[4, 4, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
          <KnowledgeGraph />
        </div>
        <div className="space-y-5">
          <CognitiveProfile />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="bg-card-gradient border border-primary/20 rounded-xl p-5 glow-neural">
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-primary" />
              <h3 className="text-foreground font-semibold text-sm">AI Study Plan — Today</h3>
            </div>
            <div className="space-y-2.5">
              {studyPlan.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 border border-border/50">
                  {typeIcon[item.type] ?? <TrendingUp size={14} className="text-primary shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{item.topic}</p>
                    <p className="text-[10px] text-muted-foreground">{item.time} · {item.type}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="h-1 w-12 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full gradient-neural rounded-full" style={{ width: `${item.mastery * 100}%` }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground font-mono">{Math.round(item.mastery * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          <AdaptiveContentFeed />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
