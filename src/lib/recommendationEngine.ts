import type { TopicNode, Quiz } from "@/data/dummy";

// Weights for the scoring function
const W_MASTERY = 0.55;    // prioritize low-mastery topics
const W_DIFFICULTY = 0.30; // align quiz difficulty with student level
const W_RECENCY = 0.15;    // favor less-attempted topics

// Difficulty numeric mapping
const DIFFICULTY_MAP: Record<string, number> = { easy: 0.3, medium: 0.6, hard: 0.9 };

// Map student Elo rating to a normalized difficulty preference (0-1)
function ratingToDifficultyPref(rating: number): number {
  // 400 → 0.1, 1200 → 0.5, 2000 → 0.9
  return Math.max(0.05, Math.min(0.95, (rating - 200) / 2000));
}

export interface RecommendedItem {
  quizId: string;
  quizTitle: string;
  topic: string;
  topicId: string;
  mastery: number;
  difficulty: string;
  score: number;           // higher = more recommended
  reason: string;
  estimatedTime: string;
  type: "quiz" | "review";
}

export function generateRecommendations(
  topicNodes: TopicNode[],
  quizzes: Quiz[],
  skillRating: number,
  maxItems = 6
): RecommendedItem[] {
  const diffPref = ratingToDifficultyPref(skillRating);

  // Build a topic lookup
  const topicMap = new Map(topicNodes.map((t) => [t.label, t]));

  const scored: RecommendedItem[] = quizzes.map((quiz) => {
    const topicNode = topicMap.get(quiz.topic);
    const mastery = topicNode?.mastery ?? 0.5;
    const attempts = topicNode?.quizAttempts ?? 0;

    // Mastery score: lower mastery = higher priority (inverted)
    const masteryScore = 1 - mastery;

    // Difficulty alignment: closer to preference = higher score
    const quizDiff = DIFFICULTY_MAP[quiz.difficulty] ?? 0.5;
    const diffScore = 1 - Math.abs(diffPref - quizDiff);

    // Recency score: fewer attempts = higher priority
    const recencyScore = 1 / (1 + attempts * 0.3);

    const totalScore =
      W_MASTERY * masteryScore +
      W_DIFFICULTY * diffScore +
      W_RECENCY * recencyScore;

    // Generate human-readable reason
    let reason: string;
    if (mastery < 0.3) {
      reason = `Low mastery (${Math.round(mastery * 100)}%) — needs attention`;
    } else if (mastery < 0.5) {
      reason = `Building foundations (${Math.round(mastery * 100)}% mastery)`;
    } else if (Math.abs(diffPref - quizDiff) < 0.15) {
      reason = "Difficulty aligned with your skill level";
    } else {
      reason = `Strengthen ${quiz.topic} (${Math.round(mastery * 100)}%)`;
    }

    return {
      quizId: quiz.id,
      quizTitle: quiz.title,
      topic: quiz.topic,
      topicId: topicNode?.id ?? "",
      mastery,
      difficulty: quiz.difficulty,
      score: Math.round(totalScore * 1000) / 1000,
      reason,
      estimatedTime: `${quiz.timeLimit} min`,
      type: mastery < 0.4 ? "review" : "quiz",
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, maxItems);
}

// Generate study plan items (top 3 actions for today)
export interface StudyPlanItem {
  topic: string;
  time: string;
  type: "review" | "quiz" | "new";
  mastery: number;
  reason: string;
}

export function generateStudyPlan(
  topicNodes: TopicNode[],
  quizzes: Quiz[],
  skillRating: number
): StudyPlanItem[] {
  const recs = generateRecommendations(topicNodes, quizzes, skillRating, 3);

  return recs.map((r) => ({
    topic: r.type === "review"
      ? `Review ${r.topic}`
      : `${r.quizTitle}`,
    time: r.estimatedTime,
    type: r.type === "review" ? "review" : (r.mastery < 0.2 ? "new" : "quiz"),
    mastery: r.mastery,
    reason: r.reason,
  }));
}
