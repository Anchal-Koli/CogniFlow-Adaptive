import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TopicNode } from "@/data/dummy";
import { topicNodes as defaultTopicNodes } from "@/data/dummy";

// Map quiz topic names to knowledge graph node IDs
const TOPIC_TO_NODE: Record<string, string> = {
  "Optimization": "opt",
  "Linear Algebra": "linalg",
  "Deep Learning": "dl",
  "Probability": "prob",
  "Calculus": "calc",
  "Statistics": "stats",
  "Machine Learning": "ml",
  "Numerical Methods": "nla",
};

const MASTERY_GAIN = 0.06;   // max gain per correct answer
const DECAY_FACTOR = 0.92;   // exponential decay multiplier per incorrect answer

export function getNodeIdForTopic(topic: string): string | undefined {
  return TOPIC_TO_NODE[topic];
}

interface TopicState {
  topicNodes: TopicNode[];
  updateMastery: (id: string, mastery: number) => void;
  addQuizAttempt: (id: string, timeTaken: number) => void;
  updateMasteryFromQuiz: (topic: string, answers: { correct: boolean }[]) => void;
}

export const useTopicStore = create<TopicState>()(
  persist(
    (set) => ({
      topicNodes: defaultTopicNodes,

      updateMastery: (id, mastery) =>
        set((s) => ({
          topicNodes: s.topicNodes.map((t) =>
            t.id === id ? { ...t, mastery: Math.min(1, mastery) } : t
          ),
        })),

      addQuizAttempt: (id, timeTaken) =>
        set((s) => ({
          topicNodes: s.topicNodes.map((t) =>
            t.id === id
              ? { ...t, quizAttempts: t.quizAttempts + 1, totalTime: t.totalTime + timeTaken }
              : t
          ),
        })),

      updateMasteryFromQuiz: (topic, answers) =>
        set((s) => {
          const nodeId = TOPIC_TO_NODE[topic];
          if (!nodeId) return s;
          return {
            topicNodes: s.topicNodes.map((t) => {
              if (t.id !== nodeId) return t;
              let mastery = t.mastery;
              for (const a of answers) {
                if (a.correct) {
                  // Diminishing returns as mastery approaches 1
                  mastery += MASTERY_GAIN * (1 - mastery);
                } else {
                  // Exponential decay
                  mastery *= DECAY_FACTOR;
                }
              }
              return { ...t, mastery: Math.min(1, Math.max(0, Math.round(mastery * 1000) / 1000)) };
            }),
          };
        }),
    }),
    { name: "cogniflow-topics" }
  )
);
