/**
 * API Route: /api/profile
 *
 * Gerencia perfil do usuario autenticado.
 *
 * GET   — Obtem perfil completo do usuario (requer autenticacao)
 * PATCH — Atualiza campos permitidos: full_name, phone (requer autenticacao)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAuth } from "@/lib/errors";

// GET: Obtem perfil completo do usuario autenticado
export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  // Busca todas as informacoes do usuario
  const { data: profile, error } = (await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()) as unknown as { data: any | null; error: any };

  if (error) {
    throw new AppError("SYS_DATABASE", error.message, error);
  }

  return NextResponse.json(profile);
});

// PATCH: Atualiza campos permitidos do perfil do usuario
export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const body = await request.json();

  // Whitelist de campos atualizaveis: apenas full_name e phone
  // Protege contra atualizacao nao-autorizada de campos como role, loyalty_points, etc
  const allowedFields = ["full_name", "phone"];
  const updateData: Record<string, any> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      updateData[key] = body[key];
    }
  }

  // Validacao: ao menos um campo deve ser enviado
  if (Object.keys(updateData).length === 0) {
    throw new AppError("VAL_MISSING_FIELDS", "Nenhum campo para atualizar");
  }

  // Atualiza perfil do usuario autenticado
  const { data, error } = (await (supabase.from("profiles") as any)
    .update(updateData)
    .eq("id", user.id)
    .select()
    .single()) as { data: any | null; error: any };

  if (error) {
    throw new AppError("RES_UPDATE_FAILED", error.message, error);
  }

  return NextResponse.json(data);
});
