import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { attemptId } = await req.json();
    if (!attemptId) return new Response(JSON.stringify({ error: "attemptId required" }), { status: 400, headers: corsHeaders });

    // Fetch attempt
    const { data: attempt, error: attemptErr } = await supabaseAdmin
      .from("quiz_attempts").select("*").eq("id", attemptId).eq("user_id", user.id).single();
    if (attemptErr || !attempt) return new Response(JSON.stringify({ error: "Attempt not found" }), { status: 404, headers: corsHeaders });

    // Fetch quiz
    const { data: quiz } = await supabaseAdmin.from("quizzes").select("*").eq("id", attempt.quiz_id).single();
    if (!quiz) return new Response(JSON.stringify({ error: "Quiz not found" }), { status: 404, headers: corsHeaders });

    // Fetch profile
    const { data: profile } = await supabaseAdmin.from("profiles").select("*").eq("id", user.id).single();
    if (!profile) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404, headers: corsHeaders });

    const scorePercent = attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0;

    // === Elo Rating ===
    const DIFF_RATING: Record<string, number> = { easy: 800, medium: 1200, hard: 1600 };
    const K = 32;
    const opp = DIFF_RATING[quiz.difficulty] ?? 1200;
    const expected = 1 / (1 + Math.pow(10, (opp - profile.skill_rating) / 400));
    const newRating = Math.max(100, Math.round(profile.skill_rating + K * (scorePercent / 100 - expected)));

    // === XP & Level ===
    const xpEarned = Math.round(attempt.score * 20 + (scorePercent >= 80 ? 50 : 0));
    let newXp = profile.xp + xpEarned;
    let newLevel = profile.level;
    let newXpToNext = profile.xp_to_next;
    while (newXp >= newXpToNext) {
      newXp -= newXpToNext;
      newLevel++;
      newXpToNext = Math.round(newXpToNext * 1.2);
    }

    await supabaseAdmin.from("profiles").update({
      skill_rating: newRating, xp: newXp, level: newLevel, xp_to_next: newXpToNext,
    }).eq("id", user.id);

    // === Rating History ===
    await supabaseAdmin.from("rating_history").insert({
      user_id: user.id, rating: newRating, quiz_title: quiz.title, score_percent: scorePercent,
    });

    // === Topic Mastery ===
    const TOPIC_MAP: Record<string, string> = {
      Optimization: "opt", "Linear Algebra": "linalg", "Deep Learning": "dl",
      Probability: "prob", Calculus: "calc", Statistics: "stats",
      "Machine Learning": "ml", "Numerical Methods": "nla",
    };
    const topicId = TOPIC_MAP[quiz.topic];
    if (topicId) {
      const { data: existing } = await supabaseAdmin
        .from("topic_mastery").select("*").eq("user_id", user.id).eq("topic_id", topicId).single();

      const answers = (attempt.answers as any[]) || [];
      let mastery = existing ? Number(existing.mastery) : 0;
      for (const a of answers) {
        if (a.correct) mastery += 0.06 * (1 - mastery);
        else mastery *= 0.92;
      }
      mastery = Math.min(1, Math.max(0, Math.round(mastery * 1000) / 1000));

      if (existing) {
        await supabaseAdmin.from("topic_mastery").update({
          mastery, quiz_attempts: existing.quiz_attempts + 1, total_time: Number(existing.total_time) + Number(attempt.time_taken),
        }).eq("id", existing.id);
      } else {
        await supabaseAdmin.from("topic_mastery").insert({
          user_id: user.id, topic_id: topicId, mastery, quiz_attempts: 1, total_time: Number(attempt.time_taken),
        });
      }
    }

    // === Cognitive Traits ===
    const questionTimes = ((attempt.answers as any[]) || []).map((a: any) => a.timeTaken || 0);
    const avgTime = questionTimes.reduce((a: number, b: number) => a + b, 0) / (questionTimes.length || 1);
    const efficiency = avgTime > 0 ? (scorePercent / avgTime) * 10 : 0;

    const meanTime = avgTime;
    const variance = questionTimes.reduce((a: number, t: number) => a + Math.pow(t - meanTime, 2), 0) / (questionTimes.length || 1);
    const cv = Math.sqrt(variance) / (meanTime || 1);

    const correctPattern = ((attempt.answers as any[]) || []).map((a: any) => !!a.correct);
    const maxStreak = correctPattern.reduce((acc: { cur: number; max: number }, c: boolean) => {
      if (c) acc.cur++; else acc.cur = 0;
      acc.max = Math.max(acc.max, acc.cur);
      return acc;
    }, { cur: 0, max: 0 }).max;
    const streakBonus = Math.min(maxStreak / (correctPattern.length || 1), 1);

    const clamp = (v: number) => Math.max(10, Math.min(99, Math.round(v)));
    const newScores = [
      clamp((1 - Math.min(cv, 1.5) / 1.5) * 90 + 10),       // Working Memory
      clamp((15 / Math.max(avgTime, 1)) * 70),                // Processing Speed
      clamp(scorePercent * 0.6 + streakBonus * 40),            // Pattern Recognition
      clamp(scorePercent * 0.8 + (scorePercent > 70 ? 15 : 0)),// Abstract Reasoning
      clamp(scorePercent * 0.5 + (1 - Math.min(cv, 1)) * 40 + 10), // Metacognition
    ];

    const traitNames = ["Working Memory", "Processing Speed", "Pattern Recognition", "Abstract Reasoning", "Metacognition"];
    const LERP = 0.3;

    for (let i = 0; i < traitNames.length; i++) {
      const { data: ex } = await supabaseAdmin
        .from("cognitive_traits").select("*").eq("user_id", user.id).eq("trait", traitNames[i]).single();

      const finalScore = ex ? Math.round(ex.score * (1 - LERP) + newScores[i] * LERP) : newScores[i];

      if (ex) {
        await supabaseAdmin.from("cognitive_traits").update({ score: finalScore }).eq("id", ex.id);
      } else {
        await supabaseAdmin.from("cognitive_traits").insert({ user_id: user.id, trait: traitNames[i], score: finalScore });
      }
    }

    await supabaseAdmin.from("profiles").update({
      cognitive_efficiency: Math.round(efficiency * 100) / 100,
    }).eq("id", user.id);

    return new Response(JSON.stringify({ xpEarned, newRating, newLevel, scorePercent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
