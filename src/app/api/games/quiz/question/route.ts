import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAuth } from "@/lib/errors/auth-helpers";
import { AppError } from "@/lib/errors/app-error";
import { getGameConfig, playMinigame } from "@/lib/gamification";
import type { QuizConfig } from "@/types/database";

// GET: Fetch today's question (without the correct answer)
export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const gameConfig = await getGameConfig<QuizConfig>("quiz");
  if (!gameConfig || !gameConfig.is_active) {
    throw new AppError("GAME_DISABLED");
  }

  // Check if already played today
  const adminSupabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const { data: existingPlay } = await adminSupabase
    .from("minigame_plays")
    .select("id")
    .eq("client_id", user.id)
    .eq("game_type", "quiz")
    .gte("played_at", `${today}T00:00:00`)
    .lt("played_at", `${today}T23:59:59.999`)
    .limit(1);

  if (existingPlay && existingPlay.length > 0) {
    throw new AppError("GAME_ALREADY_PLAYED");
  }

  // Get IDs of questions already answered by this user
  const { data: answeredPlays } = await adminSupabase
    .from("minigame_plays")
    .select("result")
    .eq("client_id", user.id)
    .eq("game_type", "quiz");

  const answeredIds = new Set(
    (answeredPlays || [])
      .map((p) => ((p.result as Record<string, unknown>)?.question_id as string) || "")
      .filter(Boolean)
  );

  // Fetch a random question not yet answered
  const { data: questions, error } = await adminSupabase
    .from("quiz_questions")
    .select("id, question, options, category, difficulty")
    .eq("is_active", true)
    .order("id"); // deterministic for filtering

  if (error || !questions || questions.length === 0) {
    throw new AppError("GAME_NO_QUESTION");
  }

  // Filter out already answered questions
  const unanswered = questions.filter((q) => !answeredIds.has(q.id));

  // If all answered, allow replaying random ones
  const pool = unanswered.length > 0 ? unanswered : questions;
  const question = pool[Math.floor(Math.random() * pool.length)];

  return NextResponse.json({
    question: {
      id: question.id,
      question: question.question,
      options: question.options,
      category: question.category,
      difficulty: question.difficulty,
    },
    config: {
      time_limit_seconds: gameConfig.config.time_limit_seconds,
    },
  });
});

// POST: Answer the question
const answerSchema = z.object({
  question_id: z.string().uuid(),
  answer_index: z.number().int().min(0).max(3),
  timed_out: z.boolean().optional().default(false),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const body = await request.json();
  const parsed = answerSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError("VAL_INVALID_FORMAT");
  }

  const { question_id, answer_index, timed_out } = parsed.data;

  const gameConfig = await getGameConfig<QuizConfig>("quiz");
  if (!gameConfig || !gameConfig.is_active) {
    throw new AppError("GAME_DISABLED");
  }

  // Fetch the question with correct answer
  const adminSupabase = createAdminClient();
  const { data: question, error } = await adminSupabase
    .from("quiz_questions")
    .select("id, correct_index, question")
    .eq("id", question_id)
    .single();

  if (error || !question) {
    throw new AppError("GAME_NO_QUESTION");
  }

  const correct = !timed_out && answer_index === (question as Record<string, unknown>).correct_index;
  let coins = gameConfig.config.wrong_coins;

  if (timed_out) {
    coins = gameConfig.config.timeout_coins;
  } else if (correct) {
    coins = gameConfig.config.correct_coins;
  }

  const result = await playMinigame(user.id, "quiz", coins, {
    question_id,
    answer_index,
    correct,
    timed_out,
  });

  if (!result.success) {
    if (result.error === "ALREADY_PLAYED_TODAY") {
      throw new AppError("GAME_ALREADY_PLAYED");
    }
    throw new AppError("SYS_INTERNAL", result.error);
  }

  // Check achievements (non-blocking)
  const { checkAndAwardAchievements } = await import("@/lib/achievements");
  const newAchievements = await checkAndAwardAchievements(user.id, "game_played").catch(() => []);

  return NextResponse.json({
    correct,
    correct_index: (question as Record<string, unknown>).correct_index,
    coins_earned: coins,
    timed_out,
    new_achievements: newAchievements.map((a) => ({
      name: a.name,
      description: a.description,
      coin_reward: a.coin_reward,
    })),
  });
});
