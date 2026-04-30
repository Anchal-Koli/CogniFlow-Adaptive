/**
 * Real API Service Layer — all data flows through Supabase.
 */

import { supabase } from "@/integrations/supabase/client";
import { generateStudyPlan, generateRecommendations } from "@/lib/recommendationEngine";
import type { Quiz, TopicNode, StudentProfile } from "@/data/dummy";
import type { RatingHistoryEntry, CognitiveTraitData } from "@/stores/studentStore";

// ---------- helpers ----------

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ---------- Topic config (static topology) ----------

const TOPIC_CONFIG: Record<string, { id: string; label: string; resources: string[]; prerequisites: string[] }> = {
  calc: { id: "calc", label: "Calculus", resources: ["MIT OCW Calculus", "3Blue1Brown Essence of Calculus"], prerequisites: [] },
  linalg: { id: "linalg", label: "Linear Algebra", resources: ["Gilbert Strang Lectures", "Interactive Linear Algebra"], prerequisites: ["calc"] },
  prob: { id: "prob", label: "Probability", resources: ["Khan Academy Probability", "StatQuest"], prerequisites: ["calc"] },
  stats: { id: "stats", label: "Statistics", resources: ["Intro to Statistical Learning", "Statistics 110 Harvard"], prerequisites: ["prob"] },
  ml: { id: "ml", label: "Machine Learning", resources: ["Andrew Ng ML Course", "Hands-On ML"], prerequisites: ["linalg", "stats"] },
  dl: { id: "dl", label: "Deep Learning", resources: ["Deep Learning Book", "Fast.ai"], prerequisites: ["ml"] },
  opt: { id: "opt", label: "Optimization", resources: ["Convex Optimization Boyd", "Optimization for ML"], prerequisites: ["calc", "linalg"] },
  nla: { id: "nla", label: "Numerical Methods", resources: ["Numerical Recipes", "Computational Science"], prerequisites: [] },
};

// ---------- Student / Profile ----------

export async function fetchProfile(): Promise<StudentProfile> {
  const userId = await getUserId();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;

  const { data: attempts } = await supabase.from("quiz_attempts").select("time_taken").eq("user_id", userId);
  const totalSeconds = (attempts || []).reduce((sum, a) => sum + Number(a.time_taken), 0);

  const displayName = data.display_name || "Learner";
  return {
    name: displayName,
    email: user?.email || "",
    avatar: displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
    level: data.level,
    xp: data.xp,
    xpToNext: data.xp_to_next,
    streak: data.streak,
    totalHours: Math.round(totalSeconds / 3600 * 10) / 10,
    badges: [],
    learningStyle: data.learning_style || "Visual",
    joinDate: data.created_at,
    skillRating: data.skill_rating,
  };
}

export async function updateProfile(updates: Partial<StudentProfile>): Promise<StudentProfile> {
  const userId = await getUserId();
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.display_name = updates.name;
  if (updates.learningStyle !== undefined) dbUpdates.learning_style = updates.learningStyle;

  const { error } = await supabase.from("profiles").update(dbUpdates).eq("id", userId);
  if (error) throw error;
  return fetchProfile();
}

export async function fetchCognitiveProfile(): Promise<{
  traits: CognitiveTraitData[];
  efficiency: number;
}> {
  const userId = await getUserId();
  const [traitsRes, profileRes] = await Promise.all([
    supabase.from("cognitive_traits").select("*").eq("user_id", userId),
    supabase.from("profiles").select("cognitive_efficiency").eq("id", userId).single(),
  ]);

  const DEFAULT_TRAITS: CognitiveTraitData[] = [
    { trait: "Working Memory", score: 50, description: "Capacity to hold and manipulate information simultaneously" },
    { trait: "Processing Speed", score: 50, description: "Speed of cognitive operations and reaction time" },
    { trait: "Pattern Recognition", score: 50, description: "Ability to identify regularities in data and concepts" },
    { trait: "Abstract Reasoning", score: 50, description: "Capability to understand complex relationships" },
    { trait: "Metacognition", score: 50, description: "Awareness and control of own learning process" },
  ];

  const traits = DEFAULT_TRAITS.map(dt => {
    const dbTrait = (traitsRes.data || []).find(t => t.trait === dt.trait);
    return { ...dt, score: dbTrait?.score ?? dt.score };
  });

  return {
    traits,
    efficiency: Number(profileRes.data?.cognitive_efficiency) || 0,
  };
}

export async function fetchRatingHistory(): Promise<RatingHistoryEntry[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("rating_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(r => ({
    rating: r.rating,
    date: r.created_at,
    quizTitle: r.quiz_title,
    scorePercent: Number(r.score_percent),
  }));
}

// ---------- Quizzes ----------

// ---------- Quizzes ----------

type RawQuizQuestion = {
  id: string;
  text: string;
  options: string[];
  correctAnswer?: number;
  hint?: string;
  explanation?: string;
  difficulty?: string;
};

export async function fetchQuizzes(): Promise<Quiz[]> {
  const userId = await getUserId();

  const [quizzesRes, attemptsRes] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, title, topic, difficulty, time_limit, description, questions, is_published")
      .eq("is_published", true),
    supabase.from("quiz_attempts").select("*").eq("user_id", userId),
  ]);

  if (quizzesRes.error) throw quizzesRes.error;
  if (attemptsRes.error) throw attemptsRes.error;

  return (quizzesRes.data || []).map((q) => {
    const questions = (q.questions as RawQuizQuestion[]) || [];
    const qAttempts = (attemptsRes.data || []).filter((a) => a.quiz_id === q.id);

    const bestScore =
      qAttempts.length > 0
        ? Math.max(...qAttempts.map((a) => Math.round((a.score / a.total) * 100)))
        : null;

    return {
      id: q.id,
      title: q.title,
      topic: q.topic,
      difficulty: q.difficulty as "easy" | "medium" | "hard",
      questionCount: questions.length,
      timeLimit: q.time_limit,
      attempts: qAttempts.length,
      bestScore,
      description: q.description,
      // IMPORTANT:
      // Learner should NOT receive correctAnswer / hint / explanation in list fetch
      questions: questions.map((qn) => ({
        id: qn.id,
        text: qn.text,
        options: qn.options,
        correctAnswer: -1,
        hint: "",
        explanation: "",
        difficulty: qn.difficulty || q.difficulty,
      })),
    };
  });
}

export async function fetchQuizById(id: string): Promise<Quiz | undefined> {
  const userId = await getUserId();

  const [quizRes, attemptsRes] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, title, topic, difficulty, time_limit, description, questions, is_published")
      .eq("id", id)
      .eq("is_published", true)
      .maybeSingle(),
    supabase.from("quiz_attempts").select("*").eq("user_id", userId).eq("quiz_id", id),
  ]);

  if (quizRes.error) throw quizRes.error;
  if (attemptsRes.error) throw attemptsRes.error;

  if (!quizRes.data) return undefined;

  const q = quizRes.data;
  const questions = (q.questions as RawQuizQuestion[]) || [];
  const qAttempts = attemptsRes.data || [];

  const bestScore =
    qAttempts.length > 0
      ? Math.max(...qAttempts.map((a) => Math.round((a.score / a.total) * 100)))
      : null;

  return {
    id: q.id,
    title: q.title,
    topic: q.topic,
    difficulty: q.difficulty as "easy" | "medium" | "hard",
    questionCount: questions.length,
    timeLimit: q.time_limit,
    attempts: qAttempts.length,
    bestScore,
    description: q.description,
    // IMPORTANT:
    // Still hide answers before submission
    questions: questions.map((qn) => ({
      id: qn.id,
      text: qn.text,
      options: qn.options,
      correctAnswer: -1,
      hint: "",
      explanation: "",
      difficulty: qn.difficulty || q.difficulty,
    })),
  };
}

export async function submitQuizAttempt(attempt: {
  quizId: string;
  score: number;
  total: number;
  timeTaken: number;
  answers: { questionId: string; selected: number; correct: boolean; timeTaken: number }[];
  date: string;
}) {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: userId,
      quiz_id: attempt.quizId,
      score: attempt.score,
      total: attempt.total,
      time_taken: attempt.timeTaken,
      answers: attempt.answers,
    })
    .select()
    .single();

  if (error) throw error;

  try {
    await supabase.functions.invoke("process-quiz-result", {
      body: { attemptId: data.id },
    });
  } catch (e) {
    console.error("Failed to process quiz result:", e);
  }
}
// ---------- Topics / Knowledge Graph ----------

export async function fetchTopicNodes(): Promise<TopicNode[]> {
  const userId = await getUserId();
  const { data: mastery } = await supabase
    .from("topic_mastery")
    .select("*")
    .eq("user_id", userId);

  const masteryMap = new Map((mastery || []).map(m => [m.topic_id, m]));

  return Object.values(TOPIC_CONFIG).map(cfg => {
    const m = masteryMap.get(cfg.id);
    return {
      ...cfg,
      mastery: m ? Number(m.mastery) : 0,
      quizAttempts: m?.quiz_attempts ?? 0,
      totalTime: m ? Number(m.total_time) : 0,
    };
  });
}

// ---------- Leaderboard & Social ----------

export async function fetchLeaderboard() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, xp, level, streak, skill_rating")
    .order("xp", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data || []).map((p, i) => ({
    rank: i + 1,
    name: p.display_name || "Anonymous",
    xp: p.xp,
    level: p.level,
    streak: p.streak,
  }));
}

export async function fetchNotifications() {
  return [];
}

// ---------- Analytics ----------

export async function fetchAnalytics() {
  const userId = await getUserId();
  const [attemptsRes, topicNodes, quizzesRes] = await Promise.all([
    supabase.from("quiz_attempts").select("*").eq("user_id", userId),
    fetchTopicNodes(),
    supabase.from("quizzes").select("id, topic").eq("is_published", true),
  ]);

  const attempts = attemptsRes.data || [];
  const quizTopicMap = new Map((quizzesRes.data || []).map(q => [q.id, q.topic]));

  // Topic performance
  const topicStats: Record<string, { correct: number; total: number; timeSpent: number }> = {};
  for (const attempt of attempts) {
    const topic = quizTopicMap.get(attempt.quiz_id);
    if (!topic) continue;
    if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0, timeSpent: 0 };
    topicStats[topic].correct += attempt.score;
    topicStats[topic].total += attempt.total;
    topicStats[topic].timeSpent += Number(attempt.time_taken);
  }

  const topicPerformance = topicNodes.map(node => {
    const stats = topicStats[node.label];
    return {
      topic: node.label,
      accuracy: stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      timeSpent: stats ? Math.round(stats.timeSpent / 60) : 0,
      mastery: Math.round(node.mastery * 100),
    };
  });

  // Weekly progress
  const now = new Date();
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyProgress = weekDays.map(day => ({ day, minutes: 0, xp: 0, quizzes: 0 }));

  for (const attempt of attempts) {
    const attemptDate = new Date(attempt.created_at);
    const daysSince = Math.floor((now.getTime() - attemptDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince < 7) {
      const dayIdx = (attemptDate.getDay() + 6) % 7;
      weeklyProgress[dayIdx].minutes += Math.round(Number(attempt.time_taken) / 60);
      weeklyProgress[dayIdx].xp += attempt.score * 20;
      weeklyProgress[dayIdx].quizzes += 1;
    }
  }

  const focusTimeline = [
    { time: "0-5m", focus: 92 }, { time: "5-10m", focus: 88 }, { time: "10-15m", focus: 82 },
    { time: "15-20m", focus: 75 }, { time: "20-25m", focus: 68 }, { time: "25-30m", focus: 55 },
    { time: "30-35m", focus: 48 }, { time: "35-40m", focus: 42 },
  ];

  return { topicPerformance, focusTimeline, weeklyProgress };
}

export async function fetchWeeklyProgress() {
  const analytics = await fetchAnalytics();
  return analytics.weeklyProgress;
}

// ---------- Recommendations / Study Plan ----------

export async function fetchStudyPlan() {
  const [topicNodes, quizzes, profile] = await Promise.all([
    fetchTopicNodes(),
    fetchQuizzes(),
    fetchProfile(),
  ]);
  return generateStudyPlan(topicNodes, quizzes, profile.skillRating);
}

export async function fetchRecommendations(maxItems = 6) {
  const [topicNodes, quizzes, profile] = await Promise.all([
    fetchTopicNodes(),
    fetchQuizzes(),
    fetchProfile(),
  ]);
  return generateRecommendations(topicNodes, quizzes, profile.skillRating, maxItems);
}

// ---------- Dashboard aggregate ----------

export async function fetchDashboardData() {
  const [profile, analytics, topicNodes, quizzes] = await Promise.all([
    fetchProfile(),
    fetchAnalytics(),
    fetchTopicNodes(),
    fetchQuizzes(),
  ]);
  const studyPlan = generateStudyPlan(topicNodes, quizzes, profile.skillRating);
  return { profile, weeklyProgress: analytics.weeklyProgress, topicNodes, quizzes, studyPlan };
}

// ---------- Analytics page aggregate ----------

export async function fetchAnalyticsPageData() {
  const [profile, analytics, topicNodes, quizzes, cogProfile, ratingHistory] = await Promise.all([
    fetchProfile(),
    fetchAnalytics(),
    fetchTopicNodes(),
    fetchQuizzes(),
    fetchCognitiveProfile(),
    fetchRatingHistory(),
  ]);
  return {
    topicPerformance: analytics.topicPerformance,
    focusTimeline: analytics.focusTimeline,
    weeklyProgress: analytics.weeklyProgress,
    profile,
    ratingHistory,
    cognitiveTraits: cogProfile.traits,
    cognitiveEfficiency: cogProfile.efficiency,
    quizzes,
    topicNodes,
  };
}

// ---------- Leaderboard page aggregate ----------

export async function fetchLeaderboardPageData() {
  const [profile, leaderboard] = await Promise.all([
    fetchProfile(),
    fetchLeaderboard(),
  ]);
  return { profile, leaderboard };
}
