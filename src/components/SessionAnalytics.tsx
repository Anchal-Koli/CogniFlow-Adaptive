import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

const generateDataPoint = (i: number) => {
  const engagement = 60 + Math.sin(i * 0.4) * 20 + Math.random() * 10;
  const attention = 50 + Math.cos(i * 0.3) * 25 + Math.random() * 8;
  const cognitiveLoad = 40 + Math.sin(i * 0.5 + 1) * 30 + Math.random() * 5;
  return {
    time: `${i + 1}m`,
    engagement: Math.round(Math.min(100, Math.max(0, engagement))),
    attention: Math.round(Math.min(100, Math.max(0, attention))),
    cognitiveLoad: Math.round(Math.min(100, Math.max(0, cognitiveLoad))),
  };
};

const initialData = Array.from({ length: 20 }, (_, i) => generateDataPoint(i));

const SessionAnalytics = () => {
  const [data, setData] = useState(initialData);
  const [isLive, setIsLive] = useState(false);
  const [counter, setCounter] = useState(20);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setCounter((c) => {
        const next = c + 1;
        setData((prev) => [...prev.slice(-29), generateDataPoint(next)]);
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isLive]);

  const toggleLive = useCallback(() => {
    setIsLive((l) => {
      if (!l) toast.success("Live session tracking started");
      else toast.info("Session tracking paused");
      return !l;
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="bg-card-gradient border border-border rounded-xl p-5 glow-neural"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground font-semibold text-sm tracking-wide uppercase">Session Cognitive Trace</h3>
        <div className="flex items-center gap-3">
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-engagement" /> Engagement</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-neural" /> Attention</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-synapse" /> Cog. Load</span>
          </div>
          <button
            onClick={toggleLive}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono transition-all ${
              isLive ? "bg-neural/15 text-neural border border-neural/30" : "bg-secondary text-muted-foreground border border-border hover:text-foreground"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-neural animate-pulse" : "bg-muted-foreground"}`} />
            {isLive ? "LIVE" : "START"}
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(38, 90%, 55%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(38, 90%, 55%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(185, 70%, 50%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(185, 70%, 50%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="cogGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(260, 60%, 60%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(260, 60%, 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              background: "hsl(222, 25%, 13%)",
              border: "1px solid hsl(222, 20%, 22%)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "hsl(210, 20%, 85%)",
            }}
          />
          <Area type="monotone" dataKey="engagement" stroke="hsl(38, 90%, 55%)" fill="url(#engGrad)" strokeWidth={2} dot={false} isAnimationActive={!isLive} />
          <Area type="monotone" dataKey="attention" stroke="hsl(185, 70%, 50%)" fill="url(#attGrad)" strokeWidth={2} dot={false} isAnimationActive={!isLive} />
          <Area type="monotone" dataKey="cognitiveLoad" stroke="hsl(260, 60%, 60%)" fill="url(#cogGrad)" strokeWidth={2} dot={false} isAnimationActive={!isLive} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default SessionAnalytics;
