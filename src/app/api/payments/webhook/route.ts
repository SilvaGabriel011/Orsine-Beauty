/**
 * API Route: /api/payments/webhook
 *
 * Recebe confirmacoes do gateway de pagamento.
 * Stub pronto para conectar ao Stripe ou Mercado Pago.
 *
 * POST — Processa evento do gateway (sem autenticacao, usa assinatura)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();

    // === STUB: Verificar assinatura do webhook aqui ===
    // Para Stripe: stripe.webhooks.constructEvent(rawBody, signature, secret)
    // Para Mercado Pago: verificar X-Signature header

    const adminSupabase = createAdminClient();

    // Extrair dados do evento (estrutura varia por gateway)
    const event = body as {
      type?: string; // "payment.approved" | "payment.failed" | "checkout.session.completed"
      data?: {
        appointment_id?: string;
        status?: string;
        gateway_payment_id?: string;
      };
    };

    const appointmentId = event.data?.appointment_id;
    const status = event.data?.status;
    const gatewayPaymentId = event.data?.gateway_payment_id;

    if (!appointmentId) {
      return NextResponse.json({ received: true });
    }

    // Processar resultado do pagamento
    if (status === "approved" || event.type === "checkout.session.completed") {
      await adminSupabase
        .from("appointments")
        .update({
          payment_status: "paid",
          gateway_payment_id: gatewayPaymentId || null,
        })
        .eq("id", appointmentId);
    } else if (status === "failed" || status === "rejected") {
      await adminSupabase
        .from("appointments")
        .update({ payment_status: "failed" })
        .eq("id", appointmentId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
};
