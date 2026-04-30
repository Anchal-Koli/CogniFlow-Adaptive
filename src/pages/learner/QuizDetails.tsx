import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchQuizById } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import PageLoader from "@/components/PageLoader";
import {
  ArrowLeft,
  Clock3,
  Trophy,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

type QuizResult = {
  success: boolean;
  attempt_id: string;
  quiz_id: string;
  score: number;
  correct_answers: number;
  total_questions: number;
};

const OPTION_KEYS = ["a", "b", "c", "d"];

const QuizDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ["quiz", id],
    queryFn: () => fetchQuizById(id as string),
    enabled: !!id,
    retry: 1,
  });

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const handleSelect = (questionIndex: number, optionKey: string) => {
    if (submitted) return;

    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionKey,
    }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    if (answeredCount !== quiz.questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSaving(true);

    try {
      // IMPORTANT: send a/b/c/d, not option text
      const answersPayload = quiz.questions.map((q, index) => ({
        question_id: q.id,
        selected_answer: answers[index],
      }));

      const { data, error } = await supabase.rpc("submit_quiz_attempt_secure", {
        p_quiz_id: quiz.id,
        p_answers: answersPayload,
      });

      if (error) {
        console.error("RPC submit failed:", error);
        throw error;
      }

      const resultData = data as QuizResult;
      setResult(resultData);
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit secure quiz attempt:", err);
      alert("Failed to submit quiz attempt. Check RPC function and console.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <PageLoader />;

  if (error || !quiz) {
    return (
      <div className="bg-card-gradient border border-border rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Quiz not found</h2>
        <p className="text-sm text-muted-foreground mb-4">
          The quiz does not exist or is not available right now.
        </p>
        <button
          onClick={() => navigate("/app/quizzes")}
          className="px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20"
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  const score = result?.score ?? 0;
  const correctAnswers = result?.correct_answers ?? 0;
  const totalQuestions = result?.total_questions ?? quiz.questions.length;
  const passed = score >= 60;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card-gradient border border-border rounded-2xl p-6"
      >
        <button
          onClick={() => navigate("/app/quizzes")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft size={16} />
          Back to Quizzes
        </button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{quiz.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {quiz.description || "Answer all questions and submit your attempt."}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-3 py-1 rounded-full text-xs border border-border bg-secondary/20 text-foreground">
                {quiz.topic}
              </span>
              <span className="px-3 py-1 rounded-full text-xs border border-border bg-secondary/20 text-foreground capitalize">
                {quiz.difficulty}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 min-w-full sm:min-w-[320px] lg:min-w-[420px]">
            <div className="rounded-xl border border-border bg-secondary/20 p-4 text-center">
              <Clock3 size={16} className="text-accent mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Time</p>
              <p className="text-base font-bold text-foreground">{quiz.timeLimit} min</p>
            </div>

            <div className="rounded-xl border border-border bg-secondary/20 p-4 text-center">
              <Trophy size={16} className="text-primary mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Questions</p>
              <p className="text-base font-bold text-foreground">{quiz.questions.length}</p>
            </div>

            <div className="rounded-xl border border-border bg-secondary/20 p-4 text-center">
              <CheckCircle2 size={16} className="text-mastery mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Answered</p>
              <p className="text-base font-bold text-foreground">
                {answeredCount}/{quiz.questions.length}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="space-y-5">
        {quiz.questions.map((q, index) => {
          const selected = answers[index];

          return (
            <motion.div
              key={q.id || index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="bg-card-gradient border border-border rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Q{index + 1}. {q.text}
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {q.options.map((option, optionIndex) => {
                  const optionKey = OPTION_KEYS[optionIndex];
                  const isSelected = selected === optionKey;

                  let optionClass =
                    "w-full text-left px-4 py-3 rounded-xl border transition-all ";

                  if (!submitted) {
                    optionClass += isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/20 text-foreground hover:border-primary/30";
                  } else {
                    optionClass += isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/20 text-foreground opacity-80";
                  }

                  return (
                    <button
                      key={`${q.id}-${optionIndex}`}
                      onClick={() => handleSelect(index, optionKey)}
                      className={optionClass}
                      disabled={submitted}
                    >
                      <span className="font-semibold mr-2 uppercase">{optionKey}.</span>
                      {option}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className="mt-4 rounded-xl border border-border bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground">
                    Answers are securely validated after submission.
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card-gradient border border-border rounded-2xl p-6"
      >
        {!submitted ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Ready to submit?</h3>
              <p className="text-sm text-muted-foreground">
                Submit only after answering all questions.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={saving || answeredCount !== quiz.questions.length}
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {saving ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-mastery/10 border border-mastery/20 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={28} className="text-mastery" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              {passed ? "Quiz Completed 🎉" : "Quiz Completed"}
            </h2>

            <p className="text-sm text-muted-foreground mb-6">
              Here’s your result summary for this attempt.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
              <div className="rounded-2xl border border-border bg-secondary/20 p-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Score</p>
                <p className="text-3xl font-bold text-primary">{score}%</p>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/20 p-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Correct</p>
                <p className="text-3xl font-bold text-mastery">
                  {correctAnswers}/{totalQuestions}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/20 p-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Result</p>
                <p className={`text-2xl font-bold ${passed ? "text-mastery" : "text-destructive"}`}>
                  {passed ? "PASS" : "RETRY"}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-primary/20 bg-primary/10 p-4 max-w-xl mx-auto">
              <p className="text-sm text-foreground font-medium">
                {passed
                  ? "Great job! Keep practicing to strengthen your mastery."
                  : "Good attempt. Review the topic and try again to improve your score."}
              </p>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate("/app/quizzes")}
                className="px-4 py-2 rounded-xl border border-border bg-secondary/20 text-foreground hover:border-primary/30"
              >
                Back to Quizzes
              </button>

              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90"
              >
                Retake Quiz
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default QuizDetails;