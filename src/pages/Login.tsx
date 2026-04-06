import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back!");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-card-gradient" />
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 30% 50%, hsl(185 70% 50% / 0.3) 0%, transparent 60%)" }} />
        <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 70% 70%, hsl(260 60% 60% / 0.3) 0%, transparent 50%)" }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative z-10 max-w-md px-8">
          <div className="w-16 h-16 rounded-2xl gradient-neural flex items-center justify-center mb-8 glow-neural">
            <Brain size={32} className="text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-4">Cogniflow<br /><span className="text-neural">Adaptive</span></h1>
          <p className="text-muted-foreground text-lg leading-relaxed">AI-powered adaptive learning that evolves with your cognitive profile. Master any subject with personalized paths.</p>
          <div className="flex gap-6 mt-10 text-sm text-muted-foreground">
            <div><p className="text-2xl font-bold font-mono text-neural">12K+</p><p>Active Learners</p></div>
            <div><p className="text-2xl font-bold font-mono text-engagement">94%</p><p>Completion Rate</p></div>
            <div><p className="text-2xl font-bold font-mono text-mastery">4.9★</p><p>User Rating</p></div>
          </div>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-neural flex items-center justify-center"><Brain size={20} className="text-primary-foreground" /></div>
            <span className="text-xl font-bold text-foreground">Cogniflow</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
          <p className="text-sm text-muted-foreground mb-8">Sign in to continue your learning journey</p>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-neural/40 focus:ring-1 focus:ring-neural/20 transition-all" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Password</label>
                <Link to="/forgot-password" className="text-xs text-neural hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-12 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-neural/40 focus:ring-1 focus:ring-neural/20 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl gradient-neural text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
              {loading ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account? <Link to="/signup" className="text-neural font-medium hover:underline">Sign up free</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
