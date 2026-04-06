import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, BookOpen, Target, BarChart3, Palette, ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useStudentStore } from "@/stores/studentStore";

const steps = [
  { id: "course", title: "Choose Your Courses", subtitle: "What do you want to learn?", icon: BookOpen },
  { id: "goals", title: "Set Your Goals", subtitle: "What are you aiming for?", icon: Target },
  { id: "skill", title: "Skill Level", subtitle: "Where are you starting from?", icon: BarChart3 },
  { id: "style", title: "Learning Style", subtitle: "How do you learn best?", icon: Palette },
];

const courses = [
  { id: "ml", label: "Machine Learning", emoji: "🤖" },
  { id: "stats", label: "Statistics", emoji: "📊" },
  { id: "calculus", label: "Calculus", emoji: "∫" },
  { id: "physics", label: "Physics", emoji: "⚛️" },
  { id: "cs", label: "Computer Science", emoji: "💻" },
  { id: "bio", label: "Biology", emoji: "🧬" },
  { id: "chem", label: "Chemistry", emoji: "🧪" },
  { id: "econ", label: "Economics", emoji: "📈" },
];

const goals = [
  { id: "exam", label: "Ace an Exam", desc: "Prepare for upcoming tests", icon: "🎯" },
  { id: "career", label: "Career Growth", desc: "Level up professional skills", icon: "🚀" },
  { id: "curiosity", label: "Curiosity", desc: "Learn for the love of it", icon: "💡" },
  { id: "degree", label: "Degree Prep", desc: "Stay ahead in coursework", icon: "🎓" },
];

const skillLevels = [
  { id: "beginner", label: "Beginner", desc: "Just getting started", color: "bg-mastery/10 border-mastery/30 text-mastery" },
  { id: "intermediate", label: "Intermediate", desc: "Know the basics well", color: "bg-primary/10 border-primary/30 text-primary" },
  { id: "advanced", label: "Advanced", desc: "Deep understanding", color: "bg-accent/10 border-accent/30 text-accent" },
  { id: "expert", label: "Expert", desc: "Looking for mastery", color: "bg-synapse text-synapse bg-[hsl(260_60%_60%/0.1)] border-[hsl(260_60%_60%/0.3)]" },
];

const learningStyles = [
  { id: "visual", label: "Visual", desc: "Diagrams, charts & videos", icon: "👁️" },
  { id: "reading", label: "Reading", desc: "Articles, textbooks & notes", icon: "📖" },
  { id: "practice", label: "Practice", desc: "Hands-on problems & quizzes", icon: "✍️" },
  { id: "social", label: "Social", desc: "Discussion & collaboration", icon: "💬" },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const completeOnboarding = useStudentStore((s) => s.completeOnboarding);

  const toggle = (arr: string[], set: React.Dispatch<React.SetStateAction<string[]>>, id: string) => {
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  };

  const canNext =
    (step === 0 && selectedCourses.length > 0) ||
    (step === 1 && selectedGoals.length > 0) ||
    (step === 2 && skillLevel !== "") ||
    (step === 3 && selectedStyles.length > 0);

  const handleFinish = () => {
    setLoading(true);
    completeOnboarding({
      courses: selectedCourses,
      goals: selectedGoals,
      skillLevel,
      learningStyles: selectedStyles,
    });
    setTimeout(() => {
      toast.success("Profile set up! Let's start learning 🧠");
      navigate("/");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl gradient-neural flex items-center justify-center glow-neural">
          <Brain size={20} className="text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">Cogniflow</span>
      </motion.div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8 w-full max-w-lg">
        {steps.map((s, i) => (
          <div key={s.id} className="flex-1 flex flex-col items-center gap-1.5">
            <div className={`w-full h-1.5 rounded-full transition-all duration-500 ${
              i < step ? "gradient-neural" : i === step ? "gradient-neural opacity-60" : "bg-secondary"
            }`} />
            <span className={`text-[10px] font-mono hidden sm:block transition-colors ${
              i <= step ? "text-primary" : "text-muted-foreground"
            }`}>{s.title.split(" ").pop()}</span>
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="bg-card-gradient border border-border rounded-2xl p-6 sm:p-8 glow-neural"
          >
            <div className="flex items-center gap-3 mb-1">
              {(() => { const Icon = steps[step].icon; return <Icon size={20} className="text-primary" />; })()}
              <h2 className="text-xl font-bold text-foreground">{steps[step].title}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{steps[step].subtitle}</p>

            {/* Step 0: Courses */}
            {step === 0 && (
              <div className="grid grid-cols-2 gap-3">
                {courses.map((c) => {
                  const active = selectedCourses.includes(c.id);
                  return (
                    <button key={c.id} onClick={() => toggle(selectedCourses, setSelectedCourses, c.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                        active ? "bg-primary/10 border-primary/40 text-foreground" : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                      }`}>
                      <span className="text-lg">{c.emoji}</span>
                      <span className="text-sm font-medium">{c.label}</span>
                      {active && <Check size={14} className="ml-auto text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 1: Goals */}
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {goals.map((g) => {
                  const active = selectedGoals.includes(g.id);
                  return (
                    <button key={g.id} onClick={() => toggle(selectedGoals, setSelectedGoals, g.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                        active ? "bg-primary/10 border-primary/40" : "bg-secondary/50 border-border hover:border-primary/20"
                      }`}>
                      <span className="text-2xl">{g.icon}</span>
                      <div>
                        <div className={`text-sm font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>{g.label}</div>
                        <div className="text-[11px] text-muted-foreground">{g.desc}</div>
                      </div>
                      {active && <Check size={14} className="ml-auto text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 2: Skill Level */}
            {step === 2 && (
              <div className="space-y-3">
                {skillLevels.map((s) => (
                  <button key={s.id} onClick={() => setSkillLevel(s.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                      skillLevel === s.id ? s.color : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/20"
                    }`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                      skillLevel === s.id ? "bg-background/30" : "bg-background/50"
                    }`}>{s.label[0]}</div>
                    <div className="flex-1">
                      <div className={`text-sm font-semibold ${skillLevel === s.id ? "" : "text-foreground"}`}>{s.label}</div>
                      <div className="text-[11px] text-muted-foreground">{s.desc}</div>
                    </div>
                    {skillLevel === s.id && <Check size={16} className="shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {/* Step 3: Learning Style */}
            {step === 3 && (
              <div className="grid grid-cols-2 gap-3">
                {learningStyles.map((ls) => {
                  const active = selectedStyles.includes(ls.id);
                  return (
                    <button key={ls.id} onClick={() => toggle(selectedStyles, setSelectedStyles, ls.id)}
                      className={`flex flex-col items-center gap-2 p-5 rounded-xl border text-center transition-all ${
                        active ? "bg-primary/10 border-primary/40" : "bg-secondary/50 border-border hover:border-primary/20"
                      }`}>
                      <span className="text-3xl">{ls.icon}</span>
                      <span className={`text-sm font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>{ls.label}</span>
                      <span className="text-[10px] text-muted-foreground">{ls.desc}</span>
                      {active && <Check size={14} className="text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary text-muted-foreground border border-border hover:text-foreground disabled:opacity-30 transition-all text-sm">
            <ArrowLeft size={14} /> Back
          </button>

          {step < steps.length - 1 ? (
            <button onClick={() => canNext && setStep(step + 1)} disabled={!canNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl gradient-neural text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-40 transition-all text-sm">
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button onClick={handleFinish} disabled={!canNext || loading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl gradient-neural text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-40 transition-all text-sm">
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <><Sparkles size={14} /> Start Learning</>
              )}
            </button>
          )}
        </div>

        {/* Skip */}
        <button onClick={() => navigate("/")} className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-4 transition-colors">
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
