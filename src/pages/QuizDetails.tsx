import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import PageLoader from "@/components/PageLoader";
import { ArrowLeft, Clock3, Trophy, CheckCircle2 } from "lucide-react";

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
};

type QuizData = {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  description: string;
  time_limit: number;
  questions: QuizQuestion[];
};

const fetchQuizById = async (id: string): Promise<QuizData> => {
  const { data, error } = await supabase
    .from("quizzes")
    .select("id, title, topic, difficulty, description, time_limit, questions, is_published")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (error) throw error;

  return {
    ...data,
    questions: Array.isArray(data.questions) ? data.questions : [],
  } as QuizData;
};

const QuizDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ["quiz", id],
    queryFn: () => fetchQuizById(id as string),
    enabled: !!id,
  });

  const score = useMemo(() => {
    if (!quiz) return 0;

    let correct = 0;
    quiz.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correct += 1;
      }
    });

    return Math.round((correct / quiz.questions.length) * 100);
  }, [quiz, answers]);

  const correctCount = useMemo(() => {
    if (!quiz) return 0;

    let correct = 0;
    quiz.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correct += 1;
      }
    });

    return correct;
  }, [quiz, answers]);

  if (isLoading) return <PageLoader />;

  if (error || !quiz) {
    return (
      <div className="bg-card-gradient border border-border rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Quiz not found</h2>
        <p className="text-sm text-muted-foreground mb-4">
          The quiz does not exist or is not published.
        </p>
        <button
          onClick={() => navigate("/quizzes")}
          className="px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20"
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  const handleSelect = (questionIndex: number, option: string) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: option,
    }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length !== quiz.questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card-gradient border border-border rounded-2xl p-6"
      >
        <button
          onClick={() => navigate("/quizzes")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft size={16} />
          Back to Quizzes
        </button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{quiz.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-3 py-1 rounded-full text-xs border border-border bg-secondary/20 text-foreground">
                {quiz.topic}
              </span>
              <span className="px-3 py-1 rounded-full text-xs border border-border bg-secondary/20 text-foreground capitalize">
                {quiz.difficulty}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 min-w-full sm:min-w-[260px] lg:min-w-[320px]">
            <div className="rounded-xl border border-border bg-secondary/20 p-4 text-center">
              <Clock3 size={16} className="text-accent mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Time</p>
              <p className="text-base font-bold text-foreground">{quiz.time_limit} min</p>
            </div>

            <div className="rounded-xl border border-border bg-secondary/20 p-4 text-center">
              <Trophy size={16} className="text-primary mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Questions</p>
              <p className="text-base font-bold text-foreground">{quiz.questions.length}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Questions */}
      <div className="space-y-5">
        {quiz.questions.map((q, index) => {
          const selected = answers[index];
          const isCorrect = selected === q.correctAnswer;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card-gradient border border-border rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Q{index + 1}. {q.question}
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {q.options.map((option) => {
                  const isSelected = selected === option;
                  const isRightOption = option === q.correctAnswer;

                  let optionClass =
                    "w-full text-left px-4 py-3 rounded-xl border transition-all ";

                  if (!submitted) {
                    optionClass += isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/20 text-foreground hover:border-primary/30";
                  } else {
                    if (isRightOption) {
                      optionClass += "border-mastery bg-mastery/10 text-mastery";
                    } else if (isSelected && !isRightOption) {
                      optionClass += "border-destructive bg-destructive/10 text-destructive";
                    } else {
                      optionClass += "border-border bg-secondary/20 text-foreground";
                    }
                  }

                  return (
                    <button
                      key={option}
                      onClick={() => handleSelect(index, option)}
                      className={optionClass}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className="mt-4 text-sm">
                  {isCorrect ? (
                    <p className="text-mastery font-medium flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Correct
                    </p>
                  ) : (
                    <p className="text-destructive">
                      Correct answer:{" "}
                      <span className="font-semibold">{q.correctAnswer}</span>
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Submit / Result */}
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
                Answer all questions before submitting your quiz.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
            >
              Submit Quiz
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-mastery/10 border border-mastery/20 flex items-center justify-center mx-auto mb-4">
              <Trophy size={28} className="text-mastery" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">Quiz Completed</h2>
            <p className="text-sm text-muted-foreground mb-4">
              You answered <span className="text-foreground font-semibold">{correctCount}</span> out of{" "}
              <span className="text-foreground font-semibold">{quiz.questions.length}</span> correctly.
            </p>

            <div className="inline-flex items-center justify-center px-6 py-3 rounded-2xl border border-primary/20 bg-primary/10 text-primary text-xl font-bold">
              Score: {score}%
            </div>

            <div className="mt-5">
              <button
                onClick={() => navigate("/quizzes")}
                className="px-4 py-2 rounded-xl border border-border bg-secondary/20 text-foreground hover:border-primary/30"
              >
                Back to Quizzes
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default QuizDetails;