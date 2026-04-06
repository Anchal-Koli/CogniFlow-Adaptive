import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface LearningState {
  label: string;
  active: boolean;
  complete: boolean;
  description: string;
}

const initialStates: LearningState[] = [
  { label: "Acquisition", active: false, complete: true, description: "New information is being received and parsed" },
  { label: "Encoding", active: false, complete: true, description: "Information is being stored into working memory" },
  { label: "Consolidation", active: true, complete: false, description: "Active rehearsal strengthening neural pathways" },
  { label: "Retrieval", active: false, complete: false, description: "Practice recalling stored information" },
  { label: "Transfer", active: false, complete: false, description: "Applying knowledge to novel situations" },
];

const LearningStateIndicator = () => {
  const [states, setStates] = useState<LearningState[]>(initialStates);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const advanceState = useCallback(() => {
    setStates((prev) => {
      const activeIdx = prev.findIndex((s) => s.active);
      if (activeIdx === -1 || activeIdx >= prev.length - 1) {
        toast.success("🎓 All learning phases complete! Starting new cycle.");
        return initialStates;
      }
      const next = prev.map((s, i) => ({
        ...s,
        active: i === activeIdx + 1,
        complete: i <= activeIdx ? true : s.complete,
      }));
      toast(`Advancing to: ${next[activeIdx + 1].label}`, { icon: "⚡" });
      return next;
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-card-gradient border border-border rounded-xl p-4 glow-neural"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-foreground font-semibold text-sm tracking-wide uppercase">Learning State Machine</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-synapse animate-pulse-slow">● ACTIVE</span>
          <button
            onClick={advanceState}
            className="text-[10px] font-mono px-2 py-1 rounded bg-neural/10 text-neural border border-neural/20 hover:bg-neural/20 transition-all"
          >
            Advance →
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {states.map((s, i) => (
          <div key={s.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <button
                onClick={() => {
                  setSelectedIndex(selectedIndex === i ? null : i);
                  toast(s.label, { description: s.description });
                }}
                className={`w-3 h-3 rounded-full border-2 transition-all cursor-pointer hover:scale-150 ${
                  s.active
                    ? "border-neural bg-neural glow-neural"
                    : s.complete
                    ? "border-mastery bg-mastery/30"
                    : "border-border bg-secondary hover:border-muted-foreground"
                }`}
              />
              <span
                className={`text-[9px] mt-1.5 font-mono ${
                  s.active ? "text-neural" : s.complete ? "text-mastery" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < states.length - 1 && (
              <div className={`h-px flex-1 -mt-4 ${s.complete ? "bg-mastery/40" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 rounded-lg bg-secondary/50 border border-border/50"
          >
            <p className="text-xs text-muted-foreground">{states[selectedIndex].description}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LearningStateIndicator;
