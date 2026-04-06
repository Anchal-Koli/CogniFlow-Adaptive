import { motion } from "framer-motion";
import { TrendingUp, Trophy, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
import { useStudentStore, type RatingHistoryEntry } from "@/stores/studentStore";

const tooltipStyle = {
  background: "hsl(222, 25%, 13%)",
  border: "1px solid hsl(222, 20%, 22%)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(210, 20%, 85%)",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as RatingHistoryEntry & { label: string };
  const delta = payload[0].payload.delta;
  return (
    <div style={tooltipStyle} className="px-3 py-2 space-y-1">
      <p className="font-semibold text-foreground">{d.quizTitle}</p>
      <p className="text-muted-foreground">Score: {d.scorePercent}%</p>
      <p className="flex items-center gap-1">
        <span className="text-primary font-mono font-bold">{d.rating} SR</span>
        {delta !== undefined && delta !== 0 && (
          <span className={`flex items-center text-[10px] font-mono ${delta > 0 ? "text-mastery" : "text-destructive"}`}>
            {delta > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {delta > 0 ? "+" : ""}{delta}
          </span>
        )}
      </p>
      <p className="text-[10px] text-muted-foreground">{new Date(d.date).toLocaleDateString()}</p>
    </div>
  );
};

const SkillRatingChart = () => {
  const { ratingHistory, profile } = useStudentStore();

  const chartData = [
    { rating: 1200, label: "Start", quizTitle: "Initial", scorePercent: 0, date: "", delta: 0 },
    ...ratingHistory.map((entry, i) => ({
      ...entry,
      label: `#${i + 1}`,
      delta: i === 0 ? entry.rating - 1200 : entry.rating - ratingHistory[i - 1].rating,
    })),
  ];

  const hasData = ratingHistory.length > 0;
  const peak = hasData ? Math.max(...ratingHistory.map((e) => e.rating)) : 1200;
  const latest = profile.skillRating;
  const trend = ratingHistory.length >= 2
    ? ratingHistory[ratingHistory.length - 1].rating - ratingHistory[ratingHistory.length - 2].rating
    : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="bg-card-gradient border border-border rounded-xl p-5 glow-neural">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" />
          <h3 className="text-foreground font-semibold text-sm tracking-wide uppercase">Skill Rating History</h3>
        </div>
        <div className="flex items-center gap-3">
          {hasData && (
            <>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Trophy size={12} className="text-accent" />
                <span className="font-mono">Peak: {peak}</span>
              </div>
              <div className={`flex items-center gap-1 text-xs font-mono ${trend >= 0 ? "text-mastery" : "text-destructive"}`}>
                {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {trend >= 0 ? "+" : ""}{trend}
              </div>
            </>
          )}
          <span className="text-xs font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">{latest} SR</span>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <TrendingUp size={32} className="mb-2 opacity-30" />
          <p className="text-sm">Complete a quiz to start tracking your skill rating</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(185, 70%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(185, 70%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false}
              domain={["dataMin - 50", "dataMax + 50"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={800} stroke="hsl(142, 70%, 45%)" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={1200} stroke="hsl(38, 90%, 55%)" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={1600} stroke="hsl(0, 70%, 55%)" strokeDasharray="3 3" strokeOpacity={0.4} />
            <Area type="monotone" dataKey="rating" stroke="hsl(185, 70%, 50%)" strokeWidth={2.5}
              fill="url(#ratingGradient)" dot={{ fill: "hsl(185, 70%, 50%)", r: 4, strokeWidth: 2, stroke: "hsl(222, 25%, 13%)" }}
              activeDot={{ r: 6, fill: "hsl(185, 70%, 60%)", stroke: "hsl(222, 25%, 13%)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {hasData && (
        <div className="flex items-center justify-center gap-6 mt-3">
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="w-3 h-0.5 rounded-full bg-mastery inline-block" /> Easy (800)
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="w-3 h-0.5 rounded-full bg-accent inline-block" /> Medium (1200)
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="w-3 h-0.5 rounded-full bg-destructive inline-block" /> Hard (1600)
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default SkillRatingChart;
