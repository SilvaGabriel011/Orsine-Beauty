/**
 * API Route: /api/games/history
 *
 * Obtem historico de transacoes de moedas do usuario.
 *
 * GET — Lista operacoes de moedas (ganha, gasta, ajuste) com paginacao
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAuth } from "@/lib/errors/auth-helpers";
import { getCoinHistory } from "@/lib/gamification";

// GET: Obtem historico de moedas do usuario (requer autenticacao)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  // Paginacao: limit (maximo 100) e offset para scroll infinito
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

  // Busca historico de transacoes de moedas (ganhas em jogos, gastas em resgate, ajustes)
  const history = await getCoinHistory(user.id, limit, offset);

  return NextResponse.json({ history });
});
