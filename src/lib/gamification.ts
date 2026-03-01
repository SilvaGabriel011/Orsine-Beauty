/**
 * Modulo de Gamificacao — Bela Orsine Beauty
 *
 * Gerencia minigames diarios (check-in, roleta, raspadinha, quiz, shake),
 * moedas de gamificacao e estatisticas do jogador.
 *
 * Moedas sao separadas dos pontos de fidelidade e podem ser trocadas
 * na loja de recompensas. Cada minigame tem resultado controlado por pesos
 * configuráveis (ex: roleta com probabilidades customizaveis).
 *
 * Check-in diario oferece bonus progressivo por streak consecutivo.
 * RPCs no Supabase garantem atomicidade e consistencia das operacoes.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/errors/logger";
import type {
  GameType,
  PlayerGameStats,
  WheelConfig,
  WheelSegment,
  ScratchConfig,
  ShakeConfig,
} from "@/types/database";
import { getAdelaideDateString, getAdelaideDayRange } from "@/lib/timezone";

// ── Check-in diario ─────────────────────────────────────────
// O check-in diario eh a forma mais simples de ganhar moedas e manter streak.
// Streaks consecutivos aumentam o bonus progressivamente.

export interface CheckinResult {
  success: boolean;
  coins_earned: number; // Total de moedas ganhas (base + bonus)
  streak: number;       // Numero de dias seguidos de check-in
  bonus: number;        // Bonus adicionado por streak
  base: number;         // Moedas base do check-in
  error?: string;
}

/**
 * Realiza o check-in diario do jogador.
 * Valida se ja foi feito check-in hoje e calcula bonus de streak.
 *
 * RPC: daily_checkin
 * - Retorna coins_earned (base + bonus), streak, bonus e base
 * - Lanca erro se ja foi feito check-in no dia
 */
export async function dailyCheckin(clientId: string): Promise<CheckinResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("daily_checkin", {
    p_client_id: clientId,
  });

  if (error) {
    logger.error(error, { message: "daily_checkin RPC failed" });
    return { success: false, coins_earned: 0, streak: 0, bonus: 0, base: 0, error: error.message };
  }

  const result = data as CheckinResult | null;
  if (!result) {
    return { success: false, coins_earned: 0, streak: 0, bonus: 0, base: 0, error: "NO_RESULT" };
  }

  return result;
}

// ── Jogar minigame ──────────────────────────────────────────
// Registra a jogada de um minigame e premia moedas ao jogador.
// O resultado (index da roleta, grid da raspadinha, etc) eh calculado no cliente
// e validado no servidor via RPC.

export interface PlayResult {
  success: boolean;
  coins_earned: number;
  result: Record<string, unknown>;
  error?: string;
}

/**
 * Registra uma jogada de minigame no banco de dados e premia moedas.
 * O resultado do jogo (calculado no cliente) eh armazenado junto com as moedas.
 *
 * @param clientId UUID do cliente
 * @param gameType Tipo de jogo (checkin, wheel, scratch, quiz, shake)
 * @param coinsEarned Moedas ganhas (calculadas e validadas pelo cliente)
 * @param result Dados do resultado (ex: { wheelIndex: 2 })
 */
export async function playMinigame(
  clientId: string,
  gameType: GameType,
  coinsEarned: number,
  result: Record<string, unknown> = {}
): Promise<PlayResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("play_minigame", {
    p_client_id: clientId,
    p_game_type: gameType,
    p_coins_earned: coinsEarned,
    p_result: result,
  });

  if (error) {
    logger.error(error, { message: "play_minigame RPC failed" });
    return { success: false, coins_earned: 0, result: {}, error: error.message };
  }

  const res = data as PlayResult | null;
  if (!res) {
    return { success: false, coins_earned: 0, result: {}, error: "NO_RESULT" };
  }

  return res;
}

// ── Estatisticas do jogador ─────────────────────────────────
// Recupera moedas, streaks, historico de jogos de hoje e ultimo check-in.

/**
 * Carrega todas as estatisticas do jogador relacionadas a gamificacao.
 * Inclui moedas, streaks e quais jogos ja foram feitos hoje.
 */
export async function getPlayerStats(clientId: string): Promise<PlayerGameStats | null> {
  const supabase = createAdminClient();

  // Carrega dados do perfil: moedas, streaks e ultimo check-in
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("game_coins, current_streak, longest_streak, last_checkin_date")
    .eq("id", clientId)
    .single();

  if (profileError || !profile) {
    logger.error(profileError ?? new Error("No profile"), { message: "getPlayerStats failed" });
    return null;
  }

  // Carrega os jogos já feitos hoje (usando timezone de Adelaide)
  // Importante: usa getAdelaideDayRange() para respeitar o fuso horario local
  const { startOfDay, startOfNextDay } = getAdelaideDayRange();
  const { data: plays } = await supabase
    .from("minigame_plays")
    .select("game_type")
    .eq("client_id", clientId)
    .gte("played_at", startOfDay)
    .lt("played_at", startOfNextDay);

  const todayPlays: Record<GameType, boolean> = {
    checkin: false,
    wheel: false,
    scratch: false,
    quiz: false,
    shake: false,
  };

  if (plays) {
    for (const play of plays) {
      todayPlays[play.game_type as GameType] = true;
    }
  }

  return {
    game_coins: (profile as Record<string, unknown>).game_coins as number,
    current_streak: (profile as Record<string, unknown>).current_streak as number,
    longest_streak: (profile as Record<string, unknown>).longest_streak as number,
    last_checkin_date: (profile as Record<string, unknown>).last_checkin_date as string | null,
    today_plays: todayPlays,
  };
}

// ── Configuracoes de jogos ──────────────────────────────────
// Carrega a config dinamica de cada jogo (pesos, simbolos, ranges, etc).

/**
 * Recupera a configuracao de um tipo de jogo.
 * As configs sao armazenadas em JSONB e podem ser atualizadas sem deploy.
 *
 * Exemplo de config para Wheel:
 * {
 *   segments: [
 *     { label: "50", coins: 50, weight: 0.2 },
 *     { label: "100", coins: 100, weight: 0.1 }
 *   ]
 * }
 */
export async function getGameConfig<T = Record<string, unknown>>(
  gameType: GameType
): Promise<{ config: T; is_active: boolean } | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("game_config")
    .select("config, is_active")
    .eq("game_type", gameType)
    .single();

  if (error || !data) return null;

  return {
    config: (data as Record<string, unknown>).config as T,
    is_active: (data as Record<string, unknown>).is_active as boolean,
  };
}

// ── Logica da Roleta ────────────────────────────────────────
// Usa selecao baseada em peso para garantir probabilidades corretas.
// Maior peso = maior chance de ser selecionado.

/**
 * Simula um giro da roleta baseado na configuracao com pesos.
 * Implementa selecao ponderada (weighted random selection).
 *
 * Algoritmo:
 * 1. Calcula peso total de todos os segmentos
 * 2. Gera numero aleatorio entre 0 e peso total
 * 3. Itera pelos segmentos subtraindo seus pesos ate atingir 0
 *
 * Exemplo com 3 segmentos e pesos [0.5, 0.3, 0.2]:
 * - Aleatorio em [0, 1]
 * - [0, 0.5] → segmento 0
 * - [0.5, 0.8] → segmento 1
 * - [0.8, 1] → segmento 2
 */
export function spinWheel(config: WheelConfig): { segment: WheelSegment; index: number } {
  const totalWeight = config.segments.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < config.segments.length; i++) {
    random -= config.segments[i].weight;
    if (random <= 0) {
      return { segment: config.segments[i], index: i };
    }
  }

  // Fallback: retorna ultimo segmento (nao deve acontecer se pesos estao corretos)
  return {
    segment: config.segments[config.segments.length - 1],
    index: config.segments.length - 1,
  };
}

// ── Logica da Raspadinha ────────────────────────────────────
// Gera um grid 3x3 com simbolos aleatoriamente posicionados.
// Premio determinado por peso. Numero de simbolos vencedores especificado na config.

/**
 * Simula uma raspadinha gerando um grid 3x3 com simbolos.
 *
 * Processo:
 * 1. Seleciona um premio baseado em pesos
 * 2. Escolhe um simbolo aleatorio como "vencedor"
 * 3. Embaralha 9 posicoes
 * 4. Coloca N simbolos vencedores (conforme premio.symbols)
 * 5. Preenche resto com outros simbolos
 * 6. Converte array 1D em grid 3x3
 *
 * Exemplo:
 * - Config tem 3 premios: 10 moedas (5 simbolos), 50 moedas (3 simbolos), 100 moedas (1 simbolo)
 * - Grid gerado tem uma celula ou multiplas celulas com o simbolo vencedor
 * - Cliente valida quantas celulas foram raspadas
 */
export function scratchCard(config: ScratchConfig): {
  prize: ScratchConfig["prizes"][0];
  grid: string[][];
} {
  // ── Seleciona premio baseado em pesos ────────────────────
  const totalWeight = config.prizes.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  let selectedPrize = config.prizes[config.prizes.length - 1];

  for (const prize of config.prizes) {
    random -= prize.weight;
    if (random <= 0) {
      selectedPrize = prize;
      break;
    }
  }

  // ── Gera grid 3x3 ──────────────────────────────────────────
  const symbols = config.symbol_options;
  const grid: string[][] = [];
  const winSymbol = symbols[Math.floor(Math.random() * symbols.length)];

  // Prepara array de posicoes para embaralhamento
  const positions: number[] = [];
  for (let i = 0; i < 9; i++) positions.push(i);

  // Embaralha posicoes usando Fisher-Yates shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  const flatGrid: string[] = new Array(9);

  // ── Coloca simbolos vencedores ──────────────────────────────
  for (let i = 0; i < Math.min(selectedPrize.symbols, 9); i++) {
    flatGrid[positions[i]] = winSymbol;
  }

  // ── Preenche com outros simbolos ────────────────────────────
  const filtered = symbols.filter((s) => s !== winSymbol);
  const otherSymbols = filtered.length > 0 ? filtered : symbols;
  for (let i = selectedPrize.symbols; i < 9; i++) {
    flatGrid[positions[i]] = otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
  }

  // ── Converte para grid 3x3 ──────────────────────────────────
  for (let row = 0; row < 3; row++) {
    grid.push(flatGrid.slice(row * 3, row * 3 + 3));
  }

  return { prize: selectedPrize, grid };
}

// ── Logica do Shake ─────────────────────────────────────────
// Usa selecao de peso para escolher um range, depois aleatorio dentro do range.

/**
 * Simula um shake do telefone que resulta em um numero aleatorio de moedas.
 * Cada "faixa" (weight range) tem uma probabilidade diferente.
 *
 * Exemplo de config:
 * {
 *   weights: [
 *     { range: [10, 20], weight: 0.5 },  // 50% chance de 10-20 moedas
 *     { range: [50, 100], weight: 0.3 }, // 30% chance de 50-100 moedas
 *     { range: [200, 500], weight: 0.2 } // 20% chance de 200-500 moedas
 *   ],
 *   min_coins: 10
 * }
 */
export function shakeResult(config: ShakeConfig): number {
  const totalWeight = config.weights.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const w of config.weights) {
    random -= w.weight;
    if (random <= 0) {
      // Seleciona range e retorna numero aleatorio dentro dele
      const [min, max] = w.range;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  }

  // Fallback: retorna minimo se nenhum weight foi selecionado
  return config.min_coins;
}

// ── Historico de moedas ─────────────────────────────────────
// Paginado para evitar carregar muitos dados de uma vez.

/**
 * Recupera o historico de movimentacao de moedas do jogador.
 * Retorna em ordem decrescente (mais recente primeiro).
 *
 * Util para exibir "Historico de Transacoes" na UI.
 *
 * @param clientId UUID do cliente
 * @param limit Numero de registros (default: 50)
 * @param offset Quantos registros pular para paginacao
 */
export async function getCoinHistory(
  clientId: string,
  limit: number = 50,
  offset: number = 0
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("game_coins_history")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error(error, { message: "getCoinHistory failed" });
    return [];
  }

  return data || [];
}
