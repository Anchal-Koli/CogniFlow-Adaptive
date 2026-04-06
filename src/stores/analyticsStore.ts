import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  topicPerformance as defaultTopicPerformance,
  focusTimeline as defaultFocusTimeline,
  weeklyProgress as defaultWeeklyProgress,
} from "@/data/dummy";

interface TopicPerformance {
  topic: string;
  accuracy: number;
  timeSpent: number;
  mastery: number;
}

interface FocusPoint {
  time: string;
  focus: number;
}

interface WeeklyDay {
  day: string;
  minutes: number;
  xp: number;
  quizzes: number;
}

interface AnalyticsState {
  topicPerformance: TopicPerformance[];
  focusTimeline: FocusPoint[];
  weeklyProgress: WeeklyDay[];
  updateTopicPerformance: (topic: string, updates: Partial<TopicPerformance>) => void;
  addWeeklyProgress: (day: WeeklyDay) => void;
  logStudyMinutes: (dayIndex: number, minutes: number, xp: number) => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set) => ({
      topicPerformance: defaultTopicPerformance,
      focusTimeline: defaultFocusTimeline,
      weeklyProgress: defaultWeeklyProgress,

      updateTopicPerformance: (topic, updates) =>
        set((s) => ({
          topicPerformance: s.topicPerformance.map((t) =>
            t.topic === topic ? { ...t, ...updates } : t
          ),
        })),

      addWeeklyProgress: (day) =>
        set((s) => ({ weeklyProgress: [...s.weeklyProgress.slice(-6), day] })),

      logStudyMinutes: (dayIndex, minutes, xp) =>
        set((s) => ({
          weeklyProgress: s.weeklyProgress.map((d, i) =>
            i === dayIndex ? { ...d, minutes: d.minutes + minutes, xp: d.xp + xp } : d
          ),
        })),
    }),
    { name: "cogniflow-analytics" }
  )
);
