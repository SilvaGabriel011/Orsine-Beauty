/**
 * API Route: /api/games/quiz/question
 *
 * Gerencia quiz diario: obter pergunta e submeter resposta.
 *
 * GET  — Retorna pergunta aleatoria nao respondida (sem a resposta correta)
 * POST — Valida resposta, calcula moedas (certa/errada/timeout), registra jogada
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAuth } from "@/lib/errors/auth-helpers";
import { AppError } from "@/lib/errors/app-error";
import { getGameConfig, playMinigame } from "@/lib/gamification";
import { getAdelaideDayRange } from "@/lib/timezone";
import type { QuizConfig } from "@/types/database";

// GET: Retorna pergunta aleatoria (nao respondida hoje, sem resposta correta)
export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  // Busca configuracao do quiz
  const gameConfig = await getGameConfig<QuizConfig>("quiz");
  if (!gameConfig || !gameConfig.is_active) {
    throw new AppError("GAME_DISABLED");
  }

  // Verifica se usuario ja respondeu quiz hoje
  const adminSupabase = createAdminClient();
  const { startOfDay, startOfNextDay } = getAdelaideDayRange();
  const { data: existingPlay } = await adminSupabase
    .from("minigame_plays")
    .select("id")
    .eq("client_id", user.id)
    .eq("game_type", "quiz")
    .gte("played_at", startOfDay)
    .lt("played_at", startOfNextDay)
    .limit(1);

  if (existingPlay && existingPlay.length > 0) {
    throw new AppError("GAME_ALREADY_PLAYED");
  }

  // Obtem lista de perguntas ja respondidas por este usuario (historico completo)
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

  // Busca todas as perguntas ativas (sem a resposta correta)
  const { data: questions, error } = await adminSupabase
    .from("quiz_questions")
    .select("id, question, options, category, difficulty")
    .eq("is_active", true)
    .order("id");

  if (error || !questions || questions.length === 0) {
    throw new AppError("GAME_NO_QUESTION");
  }

  // Filtra perguntas nao respondidas - preferencia para novas
  const unanswered = questions.filter((q) => !answeredIds.has(q.id));

  // Se todas respondidas, permite repetir qualquer uma (random)
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

// POST: Usuario submete resposta a pergunta
const answerSchema = z.object({
  question_id: z.string().uuid(),
  answer_index: z.number().int().min(0).max(3),
  timed_out: z.boolean().optional().default(false),
});

// POST: Usuario submete resposta (requer autenticacao)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const body = await request.json();
  const parsed = answerSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError("VAL_INVALID_FORMAT");
  }

  const { question_id, answer_index, timed_out } = parsed.data;

  // Busca configuracao do quiz
  const gameConfig = await getGameConfig<QuizConfig>("quiz");
  if (!gameConfig || !gameConfig.is_active) {
    throw new AppError("GAME_DISABLED");
  }

  // Busca pergunta (com resposta correta, secreta no servidor)
  const adminSupabase = createAdminClient();
  const { data: question, error } = await adminSupabase
    .from("quiz_questions")
    .select("id, correct_index, question")
    .eq("id", question_id)
    .single();

  if (error || !question) {
    throw new AppError("GAME_NO_QUESTION");
  }

  // Calcula acerto: compara resposta do usuario com resposta correta
  // Timeout conta como erro
  const correct = !timed_out && answer_index === (question as Record<string, unknown>).correct_index;
  let coins = gameConfig.config.wrong_coins;

  // Logica de premio: timeout < errado < certo
  if (timed_out) {
    coins = gameConfig.config.timeout_coins;
  } else if (correct) {
    coins = gameConfig.config.correct_coins;
  }

  // Registra jogada na BD
  const result = await playMinigame(user.id, "quiz", coins, {
    question_id,
    answer_index,
    correct,
    timed_out,
  });

  if (!result.success) {
    // Caso especial: usuario ja jogou quiz hoje
    if (result.error === "ALREADY_PLAYED_TODAY") {
      throw new AppError("GAME_ALREADY_PLAYED");
    }
    throw new AppError("SYS_INTERNAL", result.error);
  }

  // Verifica e premia achievements (nao-bloqueante)
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
