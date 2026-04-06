import { useState } from "react";
import { motion } from "framer-motion";
import { User, Clock, Target, Activity, ChevronDown, ChevronUp, Gauge } from "lucide-react";
import { useStudentStore } from "@/stores/studentStore";
import { toast } from "sonner";

const CognitiveProfile = () => {
  const { profile, incrementStreak, cognitiveTraits, cognitiveEfficiency } = useStudentStore();
  const [expandedTrait, setExpandedTrait] = useState<string | null>(null);

  const handleTraitClick = (trait: string, description: string) => {
    setExpandedTrait(expandedTrait === trait ? null : trait);
    toast(trait, { description });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="bg-card-gradient border border-border rounded-xl p-5 glow-neural"
    >
      <h3 className="text-foreground font-semibold text-sm tracking-wide uppercase mb-5">Cognitive Profile</h3>

      <div className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 rounded-full gradient-neural flex items-center justify-center">
          <User size={20} className="text-primary-foreground" />
        </div>
        <div>
          <p className="text-foreground font-medium">{profile.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{profile.learningStyle}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <button
          onClick={() => {
            incrementStreak();
            toast.success(`Streak extended to ${profile.streak + 1} days! 🔥`);
          }}
          className="text-center p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
        >
          <Activity size={14} className="mx-auto text-engagement mb-1" />
          <p className="text-foreground font-mono text-sm font-bold">{profile.streak}</p>
          <p className="text-[10px] text-muted-foreground">Day Streak</p>
        </button>
        <div className="text-center p-2 rounded-lg bg-secondary/50">
          <Clock size={14} className="mx-auto text-neural mb-1" />
          <p className="text-foreground font-mono text-sm font-bold">{profile.totalHours}h</p>
          <p className="text-[10px] text-muted-foreground">Total Time</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-secondary/50">
          <Target size={14} className="mx-auto text-synapse mb-1" />
          <p className="text-foreground font-mono text-sm font-bold">Consolidation</p>
          <p className="text-[10px] text-muted-foreground">Phase</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-primary/5 border border-primary/10">
        <Gauge size={14} className="text-primary" />
        <span className="text-[10px] text-muted-foreground">Cognitive Efficiency</span>
        <span className="ml-auto text-sm font-bold font-mono text-primary">{cognitiveEfficiency || "—"}</span>
      </div>

      <div className="space-y-3">
        {cognitiveTraits.map((t, i) => (
          <div key={t.trait}>
            <button
              className="w-full flex justify-between items-center text-xs mb-1 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleTraitClick(t.trait, t.description)}
            >
              <span className="text-muted-foreground flex items-center gap-1">
                {t.trait}
                {expandedTrait === t.trait ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </span>
              <span className="font-mono text-foreground">{t.score}</span>
            </button>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${t.score}%` }}
                transition={{ duration: 1, delay: 0.7 + i * 0.1 }}
                className="h-full rounded-full gradient-neural"
              />
            </div>
            {expandedTrait === t.trait && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-[10px] text-muted-foreground mt-1 pl-1"
              >
                {t.description}
              </motion.p>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default CognitiveProfile;
