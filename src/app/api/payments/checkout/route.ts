/**
 * API Route: /api/payments/checkout
 *
 * Cria sessao de pagamento para um agendamento.
 * Stub pronto para conectar ao Stripe ou Mercado Pago.
 *
 * POST — Gera link/sessao de pagamento (requer autenticacao)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAuth } from "@/lib/errors/auth-helpers";
import { AppError } from "@/lib/errors/app-error";

const checkoutSchema = z.object({
  appointment_id: z.string().uuid(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError("VAL_INVALID_FORMAT", "appointment_id invalido");
  }

  const { appointment_id } = parsed.data;
  const adminSupabase = createAdminClient();

  // Busca agendamento
  const { data: appointment, error: aptError } = await adminSupabase
    .from("appointments")
    .select("id, client_id, amount_paid, payment_status, status")
    .eq("id", appointment_id)
    .single();

  if (aptError || !appointment) {
    throw new AppError("RES_NOT_FOUND", "Agendamento nao encontrado");
  }

  // Verifica autorizacao: so o proprio cliente pode pagar
  if (appointment.client_id !== user.id) {
    throw new AppError("AUTH_NOT_AUTHORIZED");
  }

  // Verifica se ja foi pago
  if (appointment.payment_status === "paid") {
    throw new AppError("VAL_INVALID_FORMAT", "Este agendamento ja foi pago");
  }

  // Verifica se agendamento esta ativo
  if (appointment.status === "cancelled") {
    throw new AppError("VAL_INVALID_FORMAT", "Nao e possivel pagar um agendamento cancelado");
  }

  // === STUB: Aqui conectar ao gateway real ===
  // Para Stripe: stripe.checkout.sessions.create(...)
  // Para Mercado Pago: mercadopago.preference.create(...)
  // Por enquanto retorna URL simulada

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const mockCheckoutUrl = `${appUrl}/agendar/pagamento/sucesso?appointment_id=${appointment_id}&mock=true`;

  // Atualiza payment_status para pending
  await adminSupabase
    .from("appointments")
    .update({ payment_status: "pending", payment_method: "online" })
    .eq("id", appointment_id);

  return NextResponse.json({
    checkout_url: mockCheckoutUrl,
    appointment_id,
    amount: appointment.amount_paid,
  });
});
