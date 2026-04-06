import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Clock, Trophy, ChevronRight, Filter, Zap, TrendingUp, Sparkles } from "lucide-react";
import { useQuizStore, calculateElo, getRecommendedDifficulty } from "@/stores/quizStore";
import { useStudentStore } from "@/stores/studentStore";
import { useTopicStore, getNodeIdForTopic } from "@/stores/topicStore";
import type { Quiz } from "@/data/dummy";
import QuizPlayer from "@/components/QuizPlayer";
import QuizResults from "@/components/QuizResults";
import SkillRatingChart from "@/components/SkillRatingChart";
import { fetchQuizzes, fetchProfile } from "@/lib/api";
import PageLoader from "@/components/PageLoader";

type View = "list" | "playing" | "results";

const difficultyColors = {
  easy: "text-mastery bg-mastery/10 border-mastery/20",
  medium: "text-accent bg-accent/10 border-accent/20",
  hard: "text-destructive bg-destructive/10 border-destructive/20",
};

const Quizzes = () => {
  const { data: quizzes, isLoading: loadingQuizzes } = useQuery({
    queryKey: ["quizzes"],
    queryFn: fetchQuizzes,
  });
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  // Keep store references for mutations (writes still go through stores)
  const { recordAttempt } = useQuizStore();
  const { updateSkillRating, updateCognitiveProfile } = useStudentStore();
  const { updateMasteryFromQuiz, addQuizAttempt } = useTopicStore();

  const [view, setView] = useState<View>("list");
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [filter, setFilter] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [lastResults, setLastResults] = useState<{
    score: number; total: number; timeTaken: number;
    answers: { questionId: string; selected: number; correct: boolean; timeTaken: number }[];
  } | null>(null);

  if (loadingQuizzes || loadingProfile || !quizzes || !profile) return <PageLoader rows={3} />;

  const recommended = getRecommendedDifficulty(profile.skillRating);
  const diffOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
  const recOrder = diffOrder[recommended] ?? 1;
  const sorted = [...(filter === "all" ? quizzes : quizzes.filter((q) => q.difficulty === filter))].sort((a, b) => {
    const aMatch = a.difficulty === recommended ? 0 : 1;
    const bMatch = b.difficulty === recommended ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return Math.abs(diffOrder[a.difficulty] - recOrder) - Math.abs(diffOrder[b.difficulty] - recOrder);
  });

  const startQuiz = (quiz: Quiz) => { setActiveQuiz(quiz); setView("playing"); };
  const handleQuizComplete = (results: typeof lastResults) => {
    if (results && activeQuiz) {
      recordAttempt({
        quizId: activeQuiz.id,
        score: results.score,
        total: results.total,
        timeTaken: results.timeTaken,
        answers: results.answers,
        date: new Date().toISOString(),
      });
      const scorePercent = Math.round((results.score / results.total) * 100);
      const newRating = calculateElo(profile.skillRating, activeQuiz.difficulty, scorePercent);
      updateSkillRating(newRating, activeQuiz.title, scorePercent);

      // Update cognitive profile from response times
      const questionTimes = results.answers.map((a) => a.timeTaken);
      const avgTime = questionTimes.reduce((a, b) => a + b, 0) / (questionTimes.length || 1);
      const correctPattern = results.answers.map((a) => a.correct);
      updateCognitiveProfile(scorePercent, avgTime, questionTimes, correctPattern);

      // Update knowledge graph node mastery
      updateMasteryFromQuiz(activeQuiz.topic, results.answers);
      const topicNodeId = getNodeIdForTopic(activeQuiz.topic);
      if (topicNodeId) addQuizAttempt(topicNodeId, results.timeTaken);
    }
    setLastResults(results);
    setView("results");
  };
  const handleBackToList = () => { setView("list"); setActiveQuiz(null); setLastResults(null); };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {view === "list" && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Quiz Center</h1>
                <p className="text-sm text-muted-foreground mt-1">Adaptive quizzes · Recommended: <span className="capitalize font-semibold text-primary">{recommended}</span></p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <TrendingUp size={14} className="text-primary" />
                  <span className="text-xs font-bold font-mono text-primary">{profile.skillRating} SR</span>
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-muted-foreground" />
                  {(["all", "easy", "medium", "hard"] as const).map((d) => (
                    <button key={d} onClick={() => setFilter(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                        filter === d ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground"
                      }`}>{d}</button>
                  ))}
                </div>
              </div>
            </div>

            <SkillRatingChart />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {sorted.map((quiz, i) => {
                const isRecommended = quiz.difficulty === recommended;
                return (
                <motion.div key={quiz.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className={`bg-card-gradient border rounded-xl p-5 hover:border-primary/30 transition-all group cursor-pointer relative ${isRecommended ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}
                  onClick={() => startQuiz(quiz)}>
                  {isRecommended && (
                    <div className="absolute -top-2.5 left-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                      <Sparkles size={10} /> Recommended
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen size={18} className="text-primary" />
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${difficultyColors[quiz.difficulty]}`}>{quiz.difficulty}</span>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-foreground font-semibold mb-1">{quiz.title}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{quiz.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BookOpen size={12} /> {quiz.questionCount} Q</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {quiz.timeLimit}m</span>
                    <span className="flex items-center gap-1"><Zap size={12} /> {quiz.attempts} tries</span>
                    {quiz.bestScore !== null && (
                      <span className="flex items-center gap-1 text-mastery"><Trophy size={12} /> Best: {quiz.bestScore}%</span>
                    )}
                  </div>
                  {quiz.bestScore !== null && (
                    <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full gradient-mastery rounded-full" style={{ width: `${quiz.bestScore}%` }} />
                    </div>
                  )}
                </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {view === "playing" && activeQuiz && (
          <motion.div key="playing" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <QuizPlayer quiz={activeQuiz} onComplete={handleQuizComplete} onBack={handleBackToList} />
          </motion.div>
        )}

        {view === "results" && activeQuiz && lastResults && (
          <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <QuizResults quiz={activeQuiz} results={lastResults} onRetry={() => setView("playing")} onBack={handleBackToList} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Quizzes;
