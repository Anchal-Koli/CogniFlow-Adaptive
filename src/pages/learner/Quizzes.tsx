import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { fetchQuizzes } from "@/lib/api";
import PageLoader from "@/components/PageLoader";
import {
  BookOpen,
  Filter,
  Search,
  Trophy,
  Clock3,
  Target,
  ChevronRight,
} from "lucide-react";

const difficultyStyles: Record<string, string> = {
  easy: "text-mastery bg-mastery/10 border-mastery/20",
  medium: "text-accent bg-accent/10 border-accent/20",
  hard: "text-destructive bg-destructive/10 border-destructive/20",
};

const Quizzes = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [topic, setTopic] = useState("all");

  const { data: quizzes = [], isLoading, error } = useQuery({
    queryKey: ["quizzes"],
    queryFn: fetchQuizzes,
    retry: 1,
  });

  const topics = useMemo(() => {
    const uniqueTopics = Array.from(new Set(quizzes.map((q) => q.topic).filter(Boolean)));
    return ["all", ...uniqueTopics];
  }, [quizzes]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const matchesSearch =
        quiz.title.toLowerCase().includes(search.toLowerCase()) ||
        quiz.topic.toLowerCase().includes(search.toLowerCase());

      const matchesDifficulty =
        difficulty === "all" ? true : quiz.difficulty.toLowerCase() === difficulty;

      const matchesTopic = topic === "all" ? true : quiz.topic === topic;

      return matchesSearch && matchesDifficulty && matchesTopic;
    });
  }, [quizzes, search, difficulty, topic]);

  if (isLoading) return <PageLoader />;

  if (error) {
    return (
      <div className="bg-card-gradient border border-border rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Unable to load quizzes</h2>
        <p className="text-sm text-muted-foreground">
          Something went wrong while fetching quiz data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card-gradient border border-border rounded-2xl p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Quizzes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Practice topic-wise quizzes and improve your mastery.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-w-full lg:min-w-[420px]">
            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Total
              </p>
              <p className="text-lg font-bold text-foreground mt-1">{quizzes.length}</p>
            </div>

            <div className="rounded-xl border border-mastery/20 bg-mastery/10 p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Easy
              </p>
              <p className="text-lg font-bold text-mastery mt-1">
                {quizzes.filter((q) => q.difficulty.toLowerCase() === "easy").length}
              </p>
            </div>

            <div className="rounded-xl border border-accent/20 bg-accent/10 p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Topics
              </p>
              <p className="text-lg font-bold text-accent mt-1">{topics.length - 1}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card-gradient border border-border rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Filter Quizzes</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or topic..."
              className="w-full rounded-xl border border-border bg-secondary/20 pl-10 pr-4 py-3 text-sm text-foreground outline-none focus:border-primary/30"
            />
          </div>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-foreground outline-none focus:border-primary/30"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-foreground outline-none focus:border-primary/30"
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All Topics" : t}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Quiz Grid */}
      {filteredQuizzes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card-gradient border border-border rounded-2xl p-10 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-secondary/40 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No quizzes found</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            No quizzes match your current filters, or you haven’t added quiz data yet.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredQuizzes.map((quiz, index) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="bg-card-gradient border border-border rounded-2xl p-5 hover:border-primary/30 transition-all"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs text-muted-foreground truncate">{quiz.topic}</span>
                <span
                  className={`text-[10px] px-2 py-1 rounded-full border capitalize ${
                    difficultyStyles[quiz.difficulty.toLowerCase()] ||
                    "text-primary bg-primary/10 border-primary/20"
                  }`}
                >
                  {quiz.difficulty}
                </span>
              </div>

              <h3 className="text-base font-semibold text-foreground line-clamp-2 min-h-[48px]">
                {quiz.title}
              </h3>

              <p className="text-sm text-muted-foreground mt-2 line-clamp-2 min-h-[40px]">
                {quiz.description || "Practice this quiz to strengthen your understanding."}
              </p>

              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="rounded-xl border border-border bg-secondary/20 p-3 text-center">
                  <Target size={14} className="text-primary mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground">Questions</p>
                  <p className="text-sm font-bold text-foreground">{quiz.questionCount}</p>
                </div>

                <div className="rounded-xl border border-border bg-secondary/20 p-3 text-center">
                  <Clock3 size={14} className="text-accent mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground">Time</p>
                  <p className="text-sm font-bold text-foreground">{quiz.timeLimit}m</p>
                </div>

                <div className="rounded-xl border border-border bg-secondary/20 p-3 text-center">
                  <Trophy size={14} className="text-mastery mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground">Best</p>
                  <p className="text-sm font-bold text-foreground">
                    {quiz.bestScore !== null ? `${quiz.bestScore}%` : "--"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Attempts: <span className="text-foreground font-medium">{quiz.attempts}</span>
                </p>

                <button
                  onClick={() => navigate(`/app/quizzes/${quiz.id}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition text-xs font-semibold"
                >
                  Start Quiz
                  <ChevronRight size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Quizzes;