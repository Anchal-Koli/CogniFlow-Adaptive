import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Brain, Zap, Eye, Gauge, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface MetricData {
  label: string;
  value: number;
  maxValue: number;
  colorClass: string;
  icon: React.ReactNode;
  unit: string;
}

const generateMetrics = (): MetricData[] => [
  { icon: <Brain size={20} />, label: "Cognitive Load", value: Math.round(50 + Math.random() * 40), maxValue: 100, colorClass: "text-neural", unit: "%" },
  { icon: <Zap size={20} />, label: "Engagement", value: Math.round(60 + Math.random() * 35), maxValue: 100, colorClass: "text-engagement", unit: "%" },
  { icon: <Eye size={20} />, label: "Attention Span", value: Math.round(40 + Math.random() * 45), maxValue: 100, colorClass: "text-attention", unit: "%" },
  { icon: <Gauge size={20} />, label: "Mastery Level", value: Math.round(20 + Math.random() * 50), maxValue: 100, colorClass: "text-mastery", unit: "%" },
];

const getBarClass = (colorClass: string) => {
  if (colorClass === "text-neural") return "gradient-neural";
  if (colorClass === "text-engagement") return "gradient-engagement";
  if (colorClass === "text-mastery") return "gradient-mastery";
  return "bg-attention";
};

const CognitiveMetrics = () => {
  const [metrics, setMetrics] = useState<MetricData[]>(generateMetrics);
  const [isSimulating, setIsSimulating] = useState(false);

  // Live simulation mode
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((m) => ({
          ...m,
          value: Math.round(Math.min(100, Math.max(5, m.value + (Math.random() - 0.45) * 8))),
        }))
      );
    }, 1500);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const toggleSimulation = useCallback(() => {
    setIsSimulating((s) => {
      if (!s) toast.success("Live cognitive signal simulation started");
      else toast.info("Simulation paused");
      return !s;
    });
  }, []);

  const refreshMetrics = useCallback(() => {
    setMetrics(generateMetrics());
    toast("Cognitive metrics refreshed", { icon: "🧠" });
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSimulation}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isSimulating
              ? "bg-neural/20 text-neural border border-neural/30"
              : "bg-secondary text-muted-foreground hover:text-foreground border border-border"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isSimulating ? "bg-neural animate-pulse" : "bg-muted-foreground"}`} />
          {isSimulating ? "Live Simulation" : "Start Simulation"}
        </button>
        <button
          onClick={refreshMetrics}
          className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground border border-border transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card-gradient border border-border rounded-xl p-5 glow-neural cursor-pointer hover:border-neural/30 transition-all"
            onClick={() => toast(`${m.label}: ${m.value}%`, { description: m.value > 75 ? "Optimal range" : m.value > 40 ? "Moderate — adjusting content difficulty" : "Low — switching to lighter content" })}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`${m.colorClass} opacity-80`}>{m.icon}</div>
              <span className="text-sm text-muted-foreground font-medium tracking-wide uppercase">{m.label}</span>
            </div>
            <div className="flex items-end gap-2 mb-3">
              <motion.span
                key={m.value}
                initial={{ opacity: 0.5, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-3xl font-bold font-mono ${m.colorClass}`}
              >
                {m.value}
              </motion.span>
              <span className="text-muted-foreground text-sm mb-1">{m.unit}</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(m.value / m.maxValue) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`h-full rounded-full ${getBarClass(m.colorClass)}`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CognitiveMetrics;
