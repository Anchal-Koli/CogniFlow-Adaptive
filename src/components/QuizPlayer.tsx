import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Lightbulb, ArrowLeft, ArrowRight, Flag, CheckCircle2, XCircle } from "lucide-react";
import type { Quiz } from "@/data/dummy";

interface QuizPlayerProps {
  quiz: Quiz;
  onComplete: (results: {
    score: number;
    total: number;
    timeTaken: number;
    answers: { questionId: string; selected: number; correct: boolean; timeTaken: number }[];
  }) => void;
  onBack: () => void;
}

const QuizPlayer = ({ quiz, onComplete, onBack }: QuizPlayerProps) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showHint, setShowHint] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit * 60);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const questionStart = useRef(Date.now());
  const totalStart = useRef(Date.now());

  const question = quiz.questions[currentQ];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    questionStart.current = Date.now();
  }, [currentQ]);

  const selectAnswer = (idx: number) => {
    if (showFeedback) return;
    setAnswers((prev) => ({ ...prev, [currentQ]: idx }));
    setShowFeedback(true);
  };

  const nextQuestion = useCallback(() => {
    const elapsed = (Date.now() - questionStart.current) / 1000;
    setQuestionTimes((prev) => { const copy = [...prev]; copy[currentQ] = elapsed; return copy; });
    setShowFeedback(false);
    setShowHint(false);
    if (currentQ < totalQuestions - 1) setCurrentQ((c) => c + 1);
  }, [currentQ, totalQuestions]);

  const prevQuestion = () => {
    setShowFeedback(false);
    setShowHint(false);
    if (currentQ > 0) setCurrentQ((c) => c - 1);
  };

  const jumpToQuestion = (idx: number) => {
    setShowFeedback(false);
    setShowHint(false);
    setCurrentQ(idx);
  };

  const handleSubmit = useCallback(() => {
    const totalTimeTaken = Math.round((Date.now() - totalStart.current) / 1000);
    const answerResults = quiz.questions.map((q, i) => ({
      questionId: q.id,
      selected: answers[i] ?? -1,
      correct: answers[i] === q.correctAnswer,
      timeTaken: Math.round(questionTimes[i] || 0),
    }));
    const score = answerResults.filter((a) => a.correct).length;
    onComplete({ score, total: totalQuestions, timeTaken: totalTimeTaken, answers: answerResults });
  }, [answers, quiz.questions, questionTimes, totalQuestions, onComplete]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const isCorrect = answers[currentQ] === question.correctAnswer;
  const isAnswered = answers[currentQ] !== undefined;
  const isTimeLow = timeLeft < 60;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Back to Quizzes
        </button>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm ${isTimeLow ? "bg-destructive/10 text-destructive border border-destructive/30 animate-pulse" : "bg-secondary text-muted-foreground border border-border"}`}>
          <Clock size={14} />{formatTime(timeLeft)}
        </div>
      </div>

      <div className="bg-card-gradient border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-foreground">{quiz.title}</h2>
          <span className="text-xs font-mono text-muted-foreground">{answeredCount}/{totalQuestions} answered</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div animate={{ width: `${(answeredCount / totalQuestions) * 100}%` }} className="h-full gradient-neural rounded-full" />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {quiz.questions.map((_, i) => (
          <button key={i} onClick={() => jumpToQuestion(i)}
            className={`w-9 h-9 rounded-lg text-xs font-mono font-bold border transition-all ${
              i === currentQ ? "bg-primary/20 text-primary border-primary/40"
              : answers[i] !== undefined
                ? answers[i] === quiz.questions[i].correctAnswer ? "bg-mastery/10 text-mastery border-mastery/30" : "bg-destructive/10 text-destructive border-destructive/30"
                : "bg-secondary text-muted-foreground border-border hover:border-muted-foreground"
            }`}>
            {i + 1}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentQ} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
          className="bg-card-gradient border border-border rounded-xl p-6 glow-neural">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-muted-foreground">Question {currentQ + 1} of {totalQuestions}</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              question.difficulty === "easy" ? "text-mastery border-mastery/30" : question.difficulty === "medium" ? "text-accent border-accent/30" : "text-destructive border-destructive/30"
            }`}>{question.difficulty}</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-6">{question.text}</h3>
          <div className="grid gap-3">
            {question.options.map((opt, oi) => {
              let optClass = "bg-secondary/50 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground";
              if (showFeedback && isAnswered) {
                if (oi === question.correctAnswer) optClass = "bg-mastery/10 border-mastery/40 text-mastery";
                else if (oi === answers[currentQ] && !isCorrect) optClass = "bg-destructive/10 border-destructive/40 text-destructive";
              } else if (answers[currentQ] === oi) {
                optClass = "bg-primary/10 border-primary/40 text-primary";
              }
              return (
                <button key={oi} onClick={() => selectAnswer(oi)} disabled={showFeedback}
                  className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${optClass}`}>
                  <span className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <span className="text-sm">{opt}</span>
                  {showFeedback && oi === question.correctAnswer && <CheckCircle2 size={16} className="ml-auto text-mastery" />}
                  {showFeedback && oi === answers[currentQ] && !isCorrect && oi !== question.correctAnswer && <XCircle size={16} className="ml-auto text-destructive" />}
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-4 rounded-xl border ${isCorrect ? "bg-mastery/5 border-mastery/20" : "bg-destructive/5 border-destructive/20"}`}>
              <div className="flex items-center gap-2 mb-1">
                {isCorrect ? <CheckCircle2 size={16} className="text-mastery" /> : <XCircle size={16} className="text-destructive" />}
                <span className={`text-sm font-semibold ${isCorrect ? "text-mastery" : "text-destructive"}`}>{isCorrect ? "Correct!" : "Incorrect"}</span>
              </div>
              <p className="text-xs text-muted-foreground">{question.explanation}</p>
            </motion.div>
          )}

          <AnimatePresence>
            {showHint && !showFeedback && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-3 rounded-lg bg-accent/5 border border-accent/20">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb size={14} className="text-accent" />
                  <span className="text-xs font-semibold text-accent">Hint</span>
                </div>
                <p className="text-xs text-muted-foreground">{question.hint}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={prevQuestion} disabled={currentQ === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-muted-foreground border border-border hover:text-foreground disabled:opacity-30 transition-all text-sm">
            <ArrowLeft size={14} /> Prev
          </button>
          {!showFeedback && !isAnswered && (
            <button onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all text-sm">
              <Lightbulb size={14} /> Hint
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {showFeedback && currentQ < totalQuestions - 1 && (
            <button onClick={nextQuestion}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-neural text-primary-foreground font-medium hover:opacity-90 transition-all text-sm">
              Next <ArrowRight size={14} />
            </button>
          )}
          {(answeredCount === totalQuestions || (showFeedback && currentQ === totalQuestions - 1)) && (
            <button onClick={handleSubmit}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-mastery text-primary-foreground font-medium hover:opacity-90 transition-all text-sm">
              <Flag size={14} /> Submit Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPlayer;
