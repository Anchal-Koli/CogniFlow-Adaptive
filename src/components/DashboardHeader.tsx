import { motion } from "framer-motion";
import { Brain, Settings, Bell } from "lucide-react";

const DashboardHeader = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-5"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg gradient-neural flex items-center justify-center">
          <Brain size={18} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">CogniLearn</h1>
          <p className="text-[11px] text-muted-foreground font-mono">Adaptive Intelligence Engine</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <Bell size={16} />
          </button>
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-engagement animate-pulse-slow" />
        </div>
        <button className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <Settings size={16} />
        </button>
      </div>
    </motion.header>
  );
};

export default DashboardHeader;
