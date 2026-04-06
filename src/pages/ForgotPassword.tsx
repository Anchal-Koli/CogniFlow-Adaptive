import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Mail, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success("Reset link sent!");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl gradient-neural flex items-center justify-center"><Brain size={20} className="text-primary-foreground" /></div>
          <span className="text-xl font-bold text-foreground">Cogniflow</span>
        </div>
        {!sent ? (
          <>
            <h2 className="text-2xl font-bold text-foreground mb-1">Reset password</h2>
            <p className="text-sm text-muted-foreground mb-8">Enter your email and we'll send you a reset link</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                    className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-neural/40 focus:ring-1 focus:ring-neural/20 transition-all" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl gradient-neural text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
                {loading ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <>Send Reset Link <Send size={16} /></>}
              </button>
            </form>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="w-16 h-16 rounded-full bg-mastery/10 border border-mastery/20 flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={32} className="text-mastery" /></div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Check your email</h2>
            <p className="text-sm text-muted-foreground mb-6">We sent a reset link to <span className="text-neural font-mono">{email}</span></p>
          </motion.div>
        )}
        <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6 transition-colors"><ArrowLeft size={14} /> Back to sign in</Link>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
