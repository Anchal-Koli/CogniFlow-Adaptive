import { motion } from "framer-motion";
import { Trophy, Clock, Target, AlertTriangle, ArrowLeft, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import type { Quiz } from "@/data/dummy";

interface QuizResultsProps {
  quiz: Quiz;
  results: {
    score: number;
    total: number;
    timeTaken: number;
    answers: { questionId: string; selected: number; correct: boolean; timeTaken: number }[];
  };
  onRetry: () => void;
  onBack: () => void;
}

const tooltipStyle = { background: "hsl(222, 25%, 13%)", border: "1px solid hsl(222, 20%, 22%)", borderRadius: "8px", fontSize: "12px", color: "hsl(210, 20%, 85%)" };

const QuizResults = ({ quiz, results, onRetry, onBack }: QuizResultsProps) => {
  const accuracy = Math.round((results.score / results.total) * 100);
  const avgTime = Math.round(results.timeTaken / results.total);
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const weakTopics = quiz.questions
    .filter((_, i) => !results.answers[i]?.correct)
    .map((q) => q.text.split(" ").slice(0, 4).join(" "));

  const difficultyGroups: Record<string, { total: number; correct: number }> = { easy: { total: 0, correct: 0 }, medium: { total: 0, correct: 0 }, hard: { total: 0, correct: 0 } };
  quiz.questions.forEach((q, i) => {
    difficultyGroups[q.difficulty].total++;
    if (results.answers[i]?.correct) difficultyGroups[q.difficulty].correct++;
  });
  const radarData = Object.entries(difficultyGroups).filter(([, v]) => v.total > 0).map(([k, v]) => ({ difficulty: k, accuracy: Math.round((v.correct / v.total) * 100) }));
  const timeData = results.answers.map((a, i) => ({ question: `Q${i + 1}`, time: a.timeTaken }));

  const getGrade = () => {
    if (accuracy >= 90) return { letter: "A+", color: "text-mastery", msg: "Outstanding!" };
    if (accuracy >= 80) return { letter: "A", color: "text-mastery", msg: "Great job!" };
    if (accuracy >= 70) return { letter: "B", color: "text-primary", msg: "Good work!" };
    if (accuracy >= 60) return { letter: "C", color: "text-accent", msg: "Room for improvement." };
    return { letter: "D", color: "text-destructive", msg: "Review the material." };
  };
  const grade = getGrade();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to Quizzes
      </button>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card-gradient border border-border rounded-2xl p-8 text-center glow-neural">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
          className={`text-7xl font-bold font-mono ${grade.color} mb-2`}>{accuracy}%</motion.div>
        <div className={`text-2xl font-bold ${grade.color} mb-1`}>{grade.letter}</div>
        <p className="text-muted-foreground text-sm">{grade.msg}</p>
        <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><Trophy size={16} className="text-mastery" />{results.score}/{results.total} correct</span>
          <span className="flex items-center gap-2"><Clock size={16} className="text-primary" />{formatTime(results.timeTaken)} total</span>
          <span className="flex items-center gap-2"><Target size={16} className="text-accent" />{avgTime}s avg/q</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card-gradient border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">Accuracy by Difficulty</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(222, 20%, 22%)" />
              <PolarAngleAxis dataKey="difficulty" tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="accuracy" fill="hsl(185, 70%, 50%)" fillOpacity={0.3} stroke="hsl(185, 70%, 50%)" strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card-gradient border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">Time per Question (s)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={timeData}>
              <XAxis dataKey="question" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="time" fill="hsl(185, 70%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="bg-card-gradient border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Question Review</h3>
        <div className="space-y-3">
          {quiz.questions.map((q, i) => {
            const answer = results.answers[i];
            return (
              <div key={q.id} className={`p-4 rounded-xl border ${answer?.correct ? "bg-mastery/5 border-mastery/20" : "bg-destructive/5 border-destructive/20"}`}>
                <div className="flex items-start gap-3">
                  {answer?.correct ? <CheckCircle2 size={18} className="text-mastery mt-0.5 shrink-0" /> : <XCircle size={18} className="text-destructive mt-0.5 shrink-0" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">Q{i + 1}: {q.text}</p>
                    {!answer?.correct && (
                      <p className="text-xs text-muted-foreground">
                        Your answer: <span className="text-destructive">{q.options[answer?.selected ?? 0]}</span> · Correct: <span className="text-mastery">{q.options[q.correctAnswer]}</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{q.explanation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {weakTopics.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="bg-card-gradient border border-destructive/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">Areas to Review</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {weakTopics.map((t, i) => (
              <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">{t}...</span>
            ))}
          </div>
        </motion.div>
      )}

      <div className="flex gap-3">
        <button onClick={onRetry} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl gradient-neural text-primary-foreground font-semibold hover:opacity-90 transition-all">
          <RotateCcw size={16} /> Retry Quiz
        </button>
        <button onClick={onBack} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-foreground border border-border font-semibold hover:bg-secondary/80 transition-all">
          <ArrowLeft size={16} /> All Quizzes
        </button>
      </div>
    </div>
  );
};

export default QuizResults;
