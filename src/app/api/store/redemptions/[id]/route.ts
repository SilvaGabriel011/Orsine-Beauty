/**
 * API Route: /api/store/redemptions/[id]
 *
 * Gerencia status de uma troca (admin).
 *
 * PATCH — Admin atualiza status da troca (fulfilled, cancelled com reembolso)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAdmin } from "@/lib/errors/auth-helpers";
import { AppError } from "@/lib/errors/app-error";

// Schema de validacao para atualizacao de status
const updateSchema = z.object({
  status: z.enum(["fulfilled", "cancelled"]),
  notes: z.string().optional(),
});

// PATCH: Admin atualiza status da troca (requer admin)
export const PATCH = withErrorHandler(
  async (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ) => {
    const supabase = await createClient();
    // Verifica permissao de admin
    await requireAdmin(supabase);

    const params = await context!.params;
    const id = params.id;

    if (!id) {
      throw new AppError("VAL_INVALID_ID");
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("VAL_INVALID_FORMAT");
    }

    const adminSupabase = createAdminClient();

    // Prepara dados de atualizacao
    const updateData: Record<string, unknown> = {
      status: parsed.data.status,
    };

    if (parsed.data.notes) {
      updateData.notes = parsed.data.notes;
    }

    // Se status e fulfilled, registra data de conclusao
    if (parsed.data.status === "fulfilled") {
      updateData.fulfilled_at = new Date().toISOString();
    }

    // Se cancelada, reembolsa moedas ao usuario
    if (parsed.data.status === "cancelled") {
      const { data: redemption } = await adminSupabase
        .from("reward_redemptions")
        .select("client_id, coins_spent")
        .eq("id", id)
        .single();

      if (redemption) {
        const r = redemption as unknown as { client_id: string; coins_spent: number };
        // Devolve moedas gastas na troca via RPC atomico
        await adminSupabase.rpc("award_game_coins", {
          p_client_id: r.client_id,
          p_amount: r.coins_spent,
          p_source: "store",
          p_description: "Reembolso: troca cancelada",
          p_metadata: { redemption_id: id },
        });
      }
    }

    // Atualiza status da troca
    const { error } = await adminSupabase
      .from("reward_redemptions")
      .update(updateData)
      .eq("id", id);

    if (error) {
      throw new AppError("RES_UPDATE_FAILED");
    }

    return NextResponse.json({ success: true });
  }
);
