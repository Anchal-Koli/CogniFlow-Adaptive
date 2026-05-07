import { supabase } from "@/integrations/supabase/client";
import { generateStudyPlan, generateRecommendations } from "@/lib/recommendationEngine";
import type { Quiz, TopicNode, StudentProfile } from "@/data/dummy";
import type { RatingHistoryEntry, CognitiveTraitData } from "@/stores/studentStore";

// ---------- helpers ----------

async function getUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ---------- Topic config (static topology) ----------

const TOPIC_CONFIG: Record<
  string,
  { id: string; label: string; resources: string[]; prerequisites: string[] }
> = {
  calc: {
    id: "calc",
    label: "Calculus",
    resources: ["MIT OCW Calculus", "3Blue1Brown Essence of Calculus"],
    prerequisites: [],
  },
  linalg: {
    id: "linalg",
    label: "Linear Algebra",
    resources: ["Gilbert Strang Lectures", "Interactive Linear Algebra"],
    prerequisites: ["calc"],
  },
  prob: {
    id: "prob",
    label: "Probability",
    resources: ["Khan Academy Probability", "StatQuest"],
    prerequisites: ["calc"],
  },
  stats: {
    id: "stats",
    label: "Statistics",
    resources: ["Intro to Statistical Learning", "Statistics 110 Harvard"],
    prerequisites: ["prob"],
  },
  ml: {
    id: "ml",
    label: "Machine Learning",
    resources: ["Andrew Ng ML Course", "Hands-On ML"],
    prerequisites: ["linalg", "stats"],
  },
  dl: {
    id: "dl",
    label: "Deep Learning",
    resources: ["Deep Learning Book", "Fast.ai"],
    prerequisites: ["ml"],
  },
  opt: {
    id: "opt",
    label: "Optimization",
    resources: ["Convex Optimization Boyd", "Optimization for ML"],
    prerequisites: ["calc", "linalg"],
  },
  nla: {
    id: "nla",
    label: "Numerical Methods",
    resources: ["Numerical Recipes", "Computational Science"],
    prerequisites: [],
  },
};

// ---------- local types ----------

type QuizRow = {
  id: string;
  course_id: string | null;
  title: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  time_limit: number;
  description: string | null;
  is_published: boolean;
};

type QuizQuestionRow = {
  id: string;
  quiz_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: "a" | "b" | "c" | "d";
  explanation: string | null;
  topic: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
  question_order: number;
};

type QuizAttemptRow = {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number; // percentage 0-100
  total_questions: number;
  correct_answers: number;
  completed_at: string;
  created_at: string;
};

// ---------- Student / Profile ----------

export async function fetchProfile(): Promise<StudentProfile> {
  const userId = await getUserId();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;

  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("created_at")
    .eq("user_id", userId);

  // No time_taken in new schema, so use rough estimate (20 min per attempt)
  const totalHours = Math.round((((attempts?.length || 0) * 20) / 60) * 10) / 10;

  const displayName = data.display_name || "Learner";

  return {
    name: displayName,
    email: user?.email || "",
    avatar: displayName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
    level: data.level,
    xp: data.xp,
    xpToNext: data.xp_to_next,
    streak: data.streak,
    totalHours,
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
    supabase
      .from("profiles")
      .select("cognitive_efficiency")
      .eq("id", userId)
      .single(),
  ]);

  const DEFAULT_TRAITS: CognitiveTraitData[] = [
    {
      trait: "Working Memory",
      score: 50,
      description: "Capacity to hold and manipulate information simultaneously",
    },
    {
      trait: "Processing Speed",
      score: 50,
      description: "Speed of cognitive operations and reaction time",
    },
    {
      trait: "Pattern Recognition",
      score: 50,
      description: "Ability to identify regularities in data and concepts",
    },
    {
      trait: "Abstract Reasoning",
      score: 50,
      description: "Capability to understand complex relationships",
    },
    {
      trait: "Metacognition",
      score: 50,
      description: "Awareness and control of own learning process",
    },
  ];

  const traits = DEFAULT_TRAITS.map((dt) => {
    const dbTrait = (traitsRes.data || []).find((t) => t.trait === dt.trait);
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

  return (data || []).map((r) => ({
    rating: r.rating,
    date: r.created_at,
    quizTitle: r.quiz_title,
    scorePercent: Number(r.score_percent),
  }));
}

// ---------- Quizzes ----------

function mapQuestionRowToFrontend(q: QuizQuestionRow, quizDifficulty: "easy" | "medium" | "hard") {
  const correctIndexMap = { a: 0, b: 1, c: 2, d: 3 };

  return {
    id: q.id,
    text: q.question,
    options: [q.option_a, q.option_b, q.option_c, q.option_d],
    // hidden before submission in UI logic anyway, but keep safe-compatible
    correctAnswer: correctIndexMap[q.correct_answer] ?? -1,
    hint: "",
    explanation: q.explanation || "",
    difficulty: q.difficulty || quizDifficulty,
  };
}

export async function fetchQuizzes(): Promise<Quiz[]> {
  const userId = await getUserId();

  const [quizzesRes, questionsRes, attemptsRes] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, title, topic, difficulty, time_limit, description, is_published,course_id")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),

    supabase
      .from("quiz_questions")
      .select(
        "id, quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, topic, difficulty, question_order"
      )
      .order("question_order", { ascending: true }),

    supabase
      .from("quiz_attempts")
      .select("id, user_id, quiz_id, score, total_questions, correct_answers, completed_at, created_at")
      .eq("user_id", userId),
  ]);

  if (quizzesRes.error) throw quizzesRes.error;
  if (questionsRes.error) throw questionsRes.error;
  if (attemptsRes.error) throw attemptsRes.error;

  const quizzes = (quizzesRes.data || []) as QuizRow[];
  const questions = (questionsRes.data || []) as QuizQuestionRow[];
  const attempts = (attemptsRes.data || []) as QuizAttemptRow[];

  return quizzes.map((q) => {
    const quizQuestions = questions.filter((question) => question.quiz_id === q.id);
    const qAttempts = attempts.filter((a) => a.quiz_id === q.id);

    const bestScore =
      qAttempts.length > 0 ? Math.max(...qAttempts.map((a) => Number(a.score))) : null;

    return {
      id: q.id,
      course_id: q.course_id,
      title: q.title,
      
      topic: q.topic,
      difficulty: q.difficulty,
      questionCount: quizQuestions.length,
      timeLimit: q.time_limit,
      attempts: qAttempts.length,
      bestScore,
      description: q.description || "",
      questions: quizQuestions.map((question) => mapQuestionRowToFrontend(question, q.difficulty)),
    };
  });
}

export async function fetchQuizById(id: string): Promise<Quiz | undefined> {
  const userId = await getUserId();

  const [quizRes, questionsRes, attemptsRes] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, title, topic, difficulty, time_limit, description, is_published, course_id")
      .eq("id", id)
      .eq("is_published", true)
      .maybeSingle(),

    supabase
      .from("quiz_questions")
      .select(
        "id, quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, topic, difficulty, question_order"
      )
      .eq("quiz_id", id)
      .order("question_order", { ascending: true }),

    supabase
      .from("quiz_attempts")
      .select("id, user_id, quiz_id, score, total_questions, correct_answers, completed_at, created_at")
      .eq("user_id", userId)
      .eq("quiz_id", id),
  ]);

  if (quizRes.error) throw quizRes.error;
  if (questionsRes.error) throw questionsRes.error;
  if (attemptsRes.error) throw attemptsRes.error;

  if (!quizRes.data) return undefined;

  const q = quizRes.data as QuizRow;
  const quizQuestions = (questionsRes.data || []) as QuizQuestionRow[];
  const qAttempts = (attemptsRes.data || []) as QuizAttemptRow[];

  const bestScore =
    qAttempts.length > 0 ? Math.max(...qAttempts.map((a) => Number(a.score))) : null;

  return {
    id: q.id,
    course_id: q.course_id,
    title: q.title,
    topic: q.topic,
    difficulty: q.difficulty,
    questionCount: quizQuestions.length,
    timeLimit: q.time_limit,
    attempts: qAttempts.length,
    bestScore,
    description: q.description || "",
    questions: quizQuestions.map((question) => mapQuestionRowToFrontend(question, q.difficulty)),
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

  const totalQuestions = attempt.total;
  const correctAnswers = Math.round((attempt.score / 100) * totalQuestions);

  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: userId,
      quiz_id: attempt.quizId,
      score: attempt.score, // already percentage 0-100
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
    })
    .select()
    .single();

  if (error) throw error;

  // Optional: call edge function only if it still exists and expects attemptId
  try {
    await supabase.functions.invoke("process-quiz-result", {
      body: { attemptId: data.id },
    });
  } catch (e) {
    console.error("process-quiz-result skipped/failed:", e);
  }

  return data;
}

// ---------- Topics / Knowledge Graph ----------

export async function fetchTopicNodes(): Promise<TopicNode[]> {
  const userId = await getUserId();

  const { data: mastery } = await supabase
    .from("topic_mastery")
    .select("*")
    .eq("user_id", userId);

  const masteryMap = new Map((mastery || []).map((m) => [m.topic_id, m]));

  return Object.values(TOPIC_CONFIG).map((cfg) => {
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
    supabase
      .from("quiz_attempts")
      .select("id, user_id, quiz_id, score, total_questions, correct_answers, completed_at, created_at")
      .eq("user_id", userId),

    fetchTopicNodes(),

    supabase.from("quizzes").select("id, topic").eq("is_published", true),
  ]);

  if (attemptsRes.error) throw attemptsRes.error;
  if (quizzesRes.error) throw quizzesRes.error;

  const attempts = (attemptsRes.data || []) as QuizAttemptRow[];
  const quizTopicMap = new Map((quizzesRes.data || []).map((q) => [q.id, q.topic]));

  const topicStats: Record<string, { scoreSum: number; count: number }> = {};

  for (const attempt of attempts) {
    const topic = quizTopicMap.get(attempt.quiz_id);
    if (!topic) continue;

    if (!topicStats[topic]) {
      topicStats[topic] = { scoreSum: 0, count: 0 };
    }

    topicStats[topic].scoreSum += Number(attempt.score);
    topicStats[topic].count += 1;
  }

  const topicPerformance = topicNodes.map((node) => {
    const stats = topicStats[node.label];

    return {
      topic: node.label,
      accuracy: stats && stats.count > 0 ? Math.round(stats.scoreSum / stats.count) : 0,
      timeSpent: (stats?.count || 0) * 20, // estimated minutes
      mastery: Math.round(node.mastery * 100),
    };
  });

  const now = new Date();
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyProgress = weekDays.map((day) => ({ day, minutes: 0, xp: 0, quizzes: 0 }));

  for (const attempt of attempts) {
    const attemptDate = new Date(attempt.created_at);
    const daysSince = Math.floor(
      (now.getTime() - attemptDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince < 7) {
      const dayIdx = (attemptDate.getDay() + 6) % 7;
      weeklyProgress[dayIdx].minutes += 20; // estimated session length
      weeklyProgress[dayIdx].xp += Math.round((attempt.score / 100) * 100);
      weeklyProgress[dayIdx].quizzes += 1;
    }
  }

  const focusTimeline = [
    { time: "0-5m", focus: 92 },
    { time: "5-10m", focus: 88 },
    { time: "10-15m", focus: 82 },
    { time: "15-20m", focus: 75 },
    { time: "20-25m", focus: 68 },
    { time: "25-30m", focus: 55 },
    { time: "30-35m", focus: 48 },
    { time: "35-40m", focus: 42 },
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

  return {
    profile,
    weeklyProgress: analytics.weeklyProgress,
    topicNodes,
    quizzes,
    studyPlan,
  };
}

// ---------- Analytics page aggregate ----------

export async function fetchAnalyticsPageData() {
  const [profile, analytics, topicNodes, quizzes, cogProfile, ratingHistory] =
    await Promise.all([
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
  const [profile, leaderboard] = await Promise.all([fetchProfile(), fetchLeaderboard()]);

  return { profile, leaderboard };
}