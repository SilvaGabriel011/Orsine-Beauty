import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Calculate points earned based on amount paid.
 * Rule: 1 point per R$10 spent (configurable via points_per_visit).
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
 * Award loyalty points when an appointment is completed.
 * Uses atomic database RPC to prevent race conditions and ensure consistency.
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
 * Redeem loyalty points for a discount.
 * Uses atomic database RPC with row-level locking to prevent race conditions.
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
