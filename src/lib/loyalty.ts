/**
 * Modulo de Fidelidade — Bela Orsine Beauty
 *
 * Gerencia pontos de fidelidade ganhos em agendamentos e resgates.
 * Pontos sao separados de moedas de gamificacao.
 * Podem ser resgatados por descontos em servicos futuros.
 *
 * Calculo padrao: 1 ponto por R$10 gasto (customizavel).
 * RPCs garantem atomicidade das operacoes (no banco de dados).
 */

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Calcula pontos de fidelidade ganhos baseado no valor pago.
 * Formula: Math.floor(amountPaid / unitAmount) * pointsPerUnit
 *
 * Exemplo (com valores padrao):
 * - R$100 → Math.floor(100/10) * 1 = 10 pontos
 * - R$25 → Math.floor(25/10) * 1 = 2 pontos
 * - R$9 → Math.floor(9/10) * 1 = 0 pontos (arredonda para baixo)
 *
 * @param amountPaid Valor pago em reais
 * @param pointsPerUnit Quantos pontos por unidade (default: 1)
 * @param unitAmount Valor da unidade em reais (default: 10)
 */
export function calculatePointsEarned(
  amountPaid: number,
  pointsPerUnit: number,
  unitAmount: number = 10
): number {
  if (amountPaid <= 0 || pointsPerUnit <= 0) return 0;
  return Math.floor(amountPaid / unitAmount) * pointsPerUnit;
}

/**
 * Premia pontos de fidelidade quando um agendamento eh completado.
 * Usa RPC atomico no banco para evitar race conditions e garantir consistencia.
 *
 * Processa:
 * 1. Calcula pontos baseado no valor pago
 * 2. Atualiza saldo de pontos do cliente (com lock)
 * 3. Registra a transacao no historico
 *
 * RPC: award_loyalty_points
 *
 * @param appointmentId UUID do agendamento
 * @param clientId UUID do cliente
 * @param amountPaid Valor total pago pelo agendamento
 */
export async function awardLoyaltyPoints(
  appointmentId: string,
  clientId: string,
  amountPaid: number
): Promise<{ pointsEarned: number } | null> {
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase.rpc("award_loyalty_points", {
    p_appointment_id: appointmentId,
    p_client_id: clientId,
    p_amount_paid: amountPaid,
  });

  if (error) {
    console.error("Error awarding loyalty points:", error);
    return null;
  }

  const result = data as { pointsEarned: number; message?: string } | null;
  if (!result || result.pointsEarned <= 0) return null;

  return { pointsEarned: result.pointsEarned };
}

/**
 * Resgata pontos de fidelidade para obter desconto.
 * Usa RPC atomico com lock no nivel da linha para evitar race conditions.
 *
 * Processa:
 * 1. Valida se cliente tem pontos suficientes
 * 2. Busca a regra de resgate (quantos pontos = quanto desconto)
 * 3. Deduz pontos (com lock pessimista no banco)
 * 4. Registra a transacao
 *
 * RPC: redeem_loyalty_points
 *
 * @param clientId UUID do cliente
 * @param ruleId UUID da regra de resgate (ex: "50_points_10_discount")
 * @param appointmentId UUID do agendamento (opcional, para auditoria)
 */
export async function redeemLoyaltyPoints(
  clientId: string,
  ruleId: string,
  appointmentId?: string
): Promise<{ discountValue: number; pointsDeducted: number } | null> {
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase.rpc("redeem_loyalty_points", {
    p_client_id: clientId,
    p_rule_id: ruleId,
    p_appointment_id: appointmentId || null,
  });

  if (error) {
    console.error("Error redeeming loyalty points:", error);
    return null;
  }

  const result = data as {
    success: boolean;
    discountValue?: number;
    pointsDeducted?: number;
    error?: string;
  } | null;

  if (!result || !result.success) return null;

  return {
    discountValue: result.discountValue ?? 0,
    pointsDeducted: result.pointsDeducted ?? 0,
  };
}
