import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Flame, Zap, Medal, Crown } from "lucide-react";
import { fetchLeaderboardPageData } from "@/lib/api";
import PageLoader from "@/components/PageLoader";

const Leaderboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard-page"],
    queryFn: fetchLeaderboardPageData,
  });

  if (isLoading || !data) return <PageLoader rows={3} />;

  const { profile, leaderboard } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Compete with fellow learners</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card-gradient border border-primary/20 rounded-xl p-5 flex items-center gap-6 glow-neural">
        <div className="w-14 h-14 rounded-full gradient-neural flex items-center justify-center text-lg font-bold text-primary-foreground">{profile.avatar}</div>
        <div className="flex-1">
          <p className="text-foreground font-semibold">{profile.name} <span className="text-xs text-muted-foreground">(You)</span></p>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Zap size={14} className="text-primary" /> {profile.xp} XP</span>
            <span className="flex items-center gap-1"><Flame size={14} className="text-accent" /> {profile.streak} streak</span>
            <span className="flex items-center gap-1"><Medal size={14} className="text-mastery" /> Lv.{profile.level}</span>
          </div>
        </div>
        <div className="text-3xl font-bold font-mono text-primary">#{leaderboard.find((u) => u.name === profile.name)?.rank ?? "–"}</div>
      </motion.div>

      <div className="bg-card-gradient border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Your Badges</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {profile.badges.map((b) => (
            <div key={b.id} className={`p-3 rounded-xl border text-center transition-all ${b.earned ? "bg-accent/5 border-accent/20" : "bg-secondary/30 border-border opacity-40"}`}>
              <span className="text-2xl">{b.icon}</span>
              <p className="text-[10px] text-muted-foreground mt-1">{b.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card-gradient border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Global Rankings</h3>
        </div>
        <div className="divide-y divide-border">
          {leaderboard.map((user, i) => {
            const isYou = user.name === profile.name;
            return (
              <motion.div key={user.rank} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${isYou ? "bg-primary/5" : "hover:bg-secondary/30"}`}>
                <div className="w-8 text-center">
                  {user.rank === 1 ? <Crown size={18} className="text-accent mx-auto" /> :
                   user.rank <= 3 ? <Medal size={18} className="text-muted-foreground mx-auto" /> :
                   <span className="text-sm font-mono text-muted-foreground">{user.rank}</span>}
                </div>
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
                  {user.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isYou ? "text-primary" : "text-foreground"}`}>{user.name} {isYou && <span className="text-xs text-primary/60">(You)</span>}</p>
                  <p className="text-[11px] text-muted-foreground">Level {user.level} · {user.streak} day streak</p>
                </div>
                <span className="text-sm font-bold font-mono text-foreground">{user.xp.toLocaleString()} XP</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
