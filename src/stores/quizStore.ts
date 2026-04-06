import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Quiz } from "@/data/dummy";
import { quizzes as defaultQuizzes } from "@/data/dummy";

interface QuizAttempt {
  quizId: string;
  score: number;
  total: number;
  timeTaken: number;
  answers: { questionId: string; selected: number; correct: boolean; timeTaken: number }[];
  date: string;
}

const DIFFICULTY_RATING: Record<string, number> = { easy: 800, medium: 1200, hard: 1600 };
const K_FACTOR = 32;

export function calculateElo(playerRating: number, quizDifficulty: string, scorePercent: number): number {
  const opponentRating = DIFFICULTY_RATING[quizDifficulty] ?? 1200;
  const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const actual = scorePercent / 100;
  return playerRating + K_FACTOR * (actual - expected);
}

export function getRecommendedDifficulty(rating: number): "easy" | "medium" | "hard" {
  if (rating < 1000) return "easy";
  if (rating < 1400) return "medium";
  return "hard";
}

interface QuizState {
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  recordAttempt: (attempt: QuizAttempt) => void;
  getBestScore: (quizId: string) => number | null;
  getAttemptCount: (quizId: string) => number;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      quizzes: defaultQuizzes,
      attempts: [],

      recordAttempt: (attempt) =>
        set((s) => {
          const newAttempts = [...s.attempts, attempt];
          const bestForQuiz = newAttempts
            .filter((a) => a.quizId === attempt.quizId)
            .reduce((best, a) => Math.max(best, Math.round((a.score / a.total) * 100)), 0);
          return {
            attempts: newAttempts,
            quizzes: s.quizzes.map((q) =>
              q.id === attempt.quizId
                ? { ...q, bestScore: bestForQuiz, attempts: newAttempts.filter((a) => a.quizId === q.id).length }
                : q
            ),
          };
        }),

      getBestScore: (quizId) => {
        const attempts = get().attempts.filter((a) => a.quizId === quizId);
        if (attempts.length === 0) return null;
        return attempts.reduce((best, a) => Math.max(best, Math.round((a.score / a.total) * 100)), 0);
      },

      getAttemptCount: (quizId) => get().attempts.filter((a) => a.quizId === quizId).length,
    }),
    { name: "cogniflow-quizzes" }
  )
);
