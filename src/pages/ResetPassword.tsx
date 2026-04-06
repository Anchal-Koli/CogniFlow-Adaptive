import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Lock, Eye, EyeOff, Save, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) setIsRecovery(true);
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    toast.success("Password updated!");
    setTimeout(() => navigate("/"), 2000);
  };

  if (!isRecovery && !done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-muted-foreground">Invalid or expired reset link.</p>
          <Link to="/forgot-password" className="text-neural hover:underline mt-4 block">Request a new one</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl gradient-neural flex items-center justify-center"><Brain size={20} className="text-primary-foreground" /></div>
          <span className="text-xl font-bold text-foreground">Cogniflow</span>
        </div>
        {!done ? (
          <>
            <h2 className="text-2xl font-bold text-foreground mb-1">Set new password</h2>
            <p className="text-sm text-muted-foreground mb-8">Choose a strong password for your account</p>
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters"
                    className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-12 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-neural/40 focus:ring-1 focus:ring-neural/20 transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl gradient-neural text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
                {loading ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Save size={16} /> Update Password</>}
              </button>
            </form>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="w-16 h-16 rounded-full bg-mastery/10 border border-mastery/20 flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={32} className="text-mastery" /></div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Password updated!</h2>
            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
