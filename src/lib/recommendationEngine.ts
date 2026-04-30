import type { TopicNode, Quiz } from "@/data/dummy";

const W_MASTERY = 0.45;
const W_DIFFICULTY = 0.2;
const W_RECENCY = 0.1;
const W_PREREQ = 0.25;

const DIFFICULTY_MAP: Record<string, number> = {
  easy: 0.3,
  medium: 0.6,
  hard: 0.9,
};

const UNLOCK_THRESHOLD = 0.6;
const REVIEW_THRESHOLD = 0.4;

function ratingToDifficultyPref(rating: number): number {
  return Math.max(0.05, Math.min(0.95, (rating - 200) / 2000));
}

export interface RecommendedItem {
  quizId: string;
  quizTitle: string;
  topic: string;
  topicId: string;
  mastery: number;
  difficulty: string;
  score: number;
  reason: string;
  estimatedTime: string;
  type: "quiz" | "review";
  locked: boolean;
  blockedBy: string[];
  priority: "high" | "medium" | "low";
}

export interface TopicInsight {
  topicId: string;
  label: string;
  mastery: number;
  locked: boolean;
  blockedBy: string[];
  recommended: boolean;
  priorityScore: number;
  status: "weak" | "learning" | "strong";
  nextAction: "review" | "practice" | "advance" | "locked";
}

function buildTopicMap(topicNodes: TopicNode[]) {
  return new Map(topicNodes.map((t) => [t.id, t]));
}

function buildLabelMap(topicNodes: TopicNode[]) {
  return new Map(topicNodes.map((t) => [t.label, t]));
}

function getBlockedPrereqs(topic: TopicNode, topicMap: Map<string, TopicNode>): string[] {
  return (topic.prerequisites || []).filter((prereqId) => {
    const prereq = topicMap.get(prereqId);
    if (!prereq) return false;
    return prereq.mastery < UNLOCK_THRESHOLD;
  });
}

function getPriorityLabel(score: number): "high" | "medium" | "low" {
  if (score >= 0.75) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

export function generateRecommendations(
  topicNodes: TopicNode[],
  quizzes: Quiz[],
  skillRating: number,
  maxItems = 6
): RecommendedItem[] {
  const diffPref = ratingToDifficultyPref(skillRating);
  const topicMap = buildTopicMap(topicNodes);
  const topicByLabel = buildLabelMap(topicNodes);

  const scored: RecommendedItem[] = quizzes.map((quiz) => {
    const topicNode = topicByLabel.get(quiz.topic);
    const mastery = topicNode?.mastery ?? 0.5;
    const attempts = topicNode?.quizAttempts ?? 0;
    const blockedBy = topicNode ? getBlockedPrereqs(topicNode, topicMap) : [];
    const locked = blockedBy.length > 0;

    const masteryScore = 1 - mastery;
    const quizDiff = DIFFICULTY_MAP[quiz.difficulty] ?? 0.5;
    const diffScore = 1 - Math.abs(diffPref - quizDiff);
    const recencyScore = 1 / (1 + attempts * 0.3);

    // If prerequisites are satisfied => higher score
    const prereqScore = locked ? 0 : 1;

    let totalScore =
      W_MASTERY * masteryScore +
      W_DIFFICULTY * diffScore +
      W_RECENCY * recencyScore +
      W_PREREQ * prereqScore;

    // Penalize locked topics heavily
    if (locked) {
      totalScore *= 0.35;
    }

    let reason = "";
    if (locked) {
      const blockedLabels = blockedBy
        .map((id) => topicMap.get(id)?.label || id)
        .join(", ");
      reason = `Locked until prerequisite mastery improves: ${blockedLabels}`;
    } else if (mastery < 0.3) {
      reason = `Critical weak area (${Math.round(mastery * 100)}%) — immediate review recommended`;
    } else if (mastery < REVIEW_THRESHOLD) {
      reason = `Foundation gap detected (${Math.round(mastery * 100)}% mastery)`;
    } else if (Math.abs(diffPref - quizDiff) < 0.15) {
      reason = "Best difficulty match for your current skill";
    } else {
      reason = `Good next practice for ${quiz.topic} (${Math.round(mastery * 100)}% mastery)`;
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
      type: mastery < REVIEW_THRESHOLD ? "review" : "quiz",
      locked,
      blockedBy,
      priority: getPriorityLabel(totalScore),
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, maxItems);
}

export function generateStudyPlan(
  topicNodes: TopicNode[],
  quizzes: Quiz[],
  skillRating: number
) {
  const recs = generateRecommendations(topicNodes, quizzes, skillRating, 3);

  return recs.map((r) => ({
    topic: r.type === "review" ? `Review ${r.topic}` : r.quizTitle,
    time: r.estimatedTime,
    type: r.locked ? "review" : r.type === "review" ? "review" : (r.mastery < 0.2 ? "new" : "quiz"),
    mastery: r.mastery,
    reason: r.reason,
    locked: r.locked,
    blockedBy: r.blockedBy,
    priority: r.priority,
  }));
}

export function generateTopicInsights(topicNodes: TopicNode[]): TopicInsight[] {
  const topicMap = buildTopicMap(topicNodes);

  const insights = topicNodes.map((topic) => {
    const blockedBy = getBlockedPrereqs(topic, topicMap);
    const locked = blockedBy.length > 0;

    let priorityScore = 1 - topic.mastery;

    // Bottleneck bonus: if many topics depend on this one, prioritize it
    const dependents = topicNodes.filter((t) => t.prerequisites?.includes(topic.id)).length;
    priorityScore += dependents * 0.08;

    let status: TopicInsight["status"] = "learning";
    if (topic.mastery < 0.35) status = "weak";
    else if (topic.mastery >= 0.75) status = "strong";

    let nextAction: TopicInsight["nextAction"] = "practice";
    if (locked) nextAction = "locked";
    else if (topic.mastery < 0.4) nextAction = "review";
    else if (topic.mastery >= 0.75) nextAction = "advance";

    return {
      topicId: topic.id,
      label: topic.label,
      mastery: topic.mastery,
      locked,
      blockedBy,
      recommended: false,
      priorityScore: Math.round(priorityScore * 1000) / 1000,
      status,
      nextAction,
    };
  });

  const sortedAvailable = [...insights]
    .filter((i) => !i.locked)
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const topRecommendedId = sortedAvailable[0]?.topicId;

  return insights
    .map((i) => ({
      ...i,
      recommended: i.topicId === topRecommendedId,
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}