import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StudentProfile, Badge } from "@/data/dummy";
import { studentProfile as defaultProfile } from "@/data/dummy";

interface OnboardingData {
  courses: string[];
  goals: string[];
  skillLevel: string;
  learningStyles: string[];
  completed: boolean;
}

export interface RatingHistoryEntry {
  rating: number;
  date: string;
  quizTitle: string;
  scorePercent: number;
}

export interface CognitiveTraitData {
  trait: string;
  score: number;
  description: string;
}

export const DEFAULT_COGNITIVE_TRAITS: CognitiveTraitData[] = [
  { trait: "Working Memory", score: 50, description: "Capacity to hold and manipulate information simultaneously" },
  { trait: "Processing Speed", score: 50, description: "Speed of cognitive operations and reaction time" },
  { trait: "Pattern Recognition", score: 50, description: "Ability to identify regularities in data and concepts" },
  { trait: "Abstract Reasoning", score: 50, description: "Capability to understand complex relationships" },
  { trait: "Metacognition", score: 50, description: "Awareness and control of own learning process" },
];

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

interface StudentState {
  profile: StudentProfile;
  onboarding: OnboardingData;
  ratingHistory: RatingHistoryEntry[];
  cognitiveTraits: CognitiveTraitData[];
  cognitiveEfficiency: number;
  updateProfile: (updates: Partial<StudentProfile>) => void;
  addXp: (amount: number) => void;
  incrementStreak: () => void;
  earnBadge: (badgeId: string) => void;
  updateSkillRating: (newRating: number, quizTitle: string, scorePercent: number) => void;
  updateCognitiveProfile: (accuracy: number, avgResponseTime: number, questionTimes: number[], correctPattern: boolean[]) => void;
  setOnboarding: (data: Partial<OnboardingData>) => void;
  completeOnboarding: (data: Omit<OnboardingData, "completed">) => void;
}

export const useStudentStore = create<StudentState>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      onboarding: { courses: [], goals: [], skillLevel: "", learningStyles: [], completed: false },
      ratingHistory: [],
      cognitiveTraits: DEFAULT_COGNITIVE_TRAITS,
      cognitiveEfficiency: 0,

      updateProfile: (updates) =>
        set((s) => ({ profile: { ...s.profile, ...updates } })),

      addXp: (amount) =>
        set((s) => {
          const newXp = s.profile.xp + amount;
          const levelUp = newXp >= s.profile.xpToNext;
          return {
            profile: {
              ...s.profile,
              xp: levelUp ? newXp - s.profile.xpToNext : newXp,
              level: levelUp ? s.profile.level + 1 : s.profile.level,
              xpToNext: levelUp ? Math.round(s.profile.xpToNext * 1.2) : s.profile.xpToNext,
            },
          };
        }),

      incrementStreak: () =>
        set((s) => ({ profile: { ...s.profile, streak: s.profile.streak + 1 } })),

      earnBadge: (badgeId) =>
        set((s) => ({
          profile: {
            ...s.profile,
            badges: s.profile.badges.map((b) =>
              b.id === badgeId ? { ...b, earned: true, earnedDate: new Date().toISOString().split("T")[0] } : b
            ),
          },
        })),

      updateSkillRating: (newRating, quizTitle, scorePercent) =>
        set((s) => ({
          profile: { ...s.profile, skillRating: Math.max(100, Math.round(newRating)) },
          ratingHistory: [...s.ratingHistory, {
            rating: Math.max(100, Math.round(newRating)),
            date: new Date().toISOString(),
            quizTitle,
            scorePercent,
          }],
        })),

      updateCognitiveProfile: (accuracy, avgResponseTime, questionTimes, correctPattern) =>
        set((s) => {
          const efficiency = avgResponseTime > 0 ? (accuracy / avgResponseTime) * 10 : 0;
          const LERP = 0.3; // blend factor for smoothing updates

          // Processing Speed: faster responses = higher score (baseline 15s per question)
          const speedScore = clamp(Math.round((15 / Math.max(avgResponseTime, 1)) * 70), 10, 99);

          // Working Memory: consistency across questions (low variance = high working memory)
          const meanTime = questionTimes.reduce((a, b) => a + b, 0) / (questionTimes.length || 1);
          const variance = questionTimes.reduce((a, t) => a + Math.pow(t - meanTime, 2), 0) / (questionTimes.length || 1);
          const cv = Math.sqrt(variance) / (meanTime || 1); // coefficient of variation
          const wmScore = clamp(Math.round((1 - Math.min(cv, 1.5) / 1.5) * 90 + 10), 10, 99);

          // Pattern Recognition: accuracy on medium/hard questions & streak of correct answers
          const maxStreak = correctPattern.reduce((acc, c) => {
            if (c) acc.cur++;
            else acc.cur = 0;
            acc.max = Math.max(acc.max, acc.cur);
            return acc;
          }, { cur: 0, max: 0 }).max;
          const streakBonus = Math.min(maxStreak / (correctPattern.length || 1), 1);
          const prScore = clamp(Math.round(accuracy * 0.6 + streakBonus * 40), 10, 99);

          // Abstract Reasoning: accuracy weighted by difficulty (hard correct = big boost)
          const arScore = clamp(Math.round(accuracy * 0.8 + (accuracy > 70 ? 15 : 0)), 10, 99);

          // Metacognition: using hints less, answering confidently (approximated by speed consistency + accuracy)
          const mcScore = clamp(Math.round(accuracy * 0.5 + (1 - Math.min(cv, 1)) * 40 + 10), 10, 99);

          const newScores = [wmScore, speedScore, prScore, arScore, mcScore];
          const updated = s.cognitiveTraits.map((t, i) => ({
            ...t,
            score: Math.round(t.score * (1 - LERP) + newScores[i] * LERP),
          }));

          return { cognitiveTraits: updated, cognitiveEfficiency: Math.round(efficiency * 100) / 100 };
        }),

      setOnboarding: (data) =>
        set((s) => ({ onboarding: { ...s.onboarding, ...data } })),

      completeOnboarding: (data) =>
        set((s) => ({
          onboarding: { ...data, completed: true },
          profile: {
            ...s.profile,
            learningStyle: data.learningStyles.join(", ") || s.profile.learningStyle,
          },
        })),
    }),
    { name: "cogniflow-student" }
  )
);
