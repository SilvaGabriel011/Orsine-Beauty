import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAuth } from "@/lib/errors/auth-helpers";
import { AppError } from "@/lib/errors/app-error";

const redeemSchema = z.object({
  item_id: z.string().uuid(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const body = await request.json();
  const parsed = redeemSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError("VAL_INVALID_FORMAT");
  }

  const { item_id } = parsed.data;
  const adminSupabase = createAdminClient();

  // Get item
  const { data: item, error: itemError } = await adminSupabase
    .from("reward_store_items")
    .select("*")
    .eq("id", item_id)
    .eq("is_active", true)
    .single();

  if (itemError || !item) {
    throw new AppError("GAME_ITEM_NOT_FOUND");
  }

  const storeItem = item as unknown as {
    id: string;
    coin_price: number;
    stock: number | null;
    name: string;
    type: string;
    metadata: Record<string, unknown>;
  };

  // Check stock
  if (storeItem.stock !== null && storeItem.stock <= 0) {
    throw new AppError("GAME_ITEM_OUT_OF_STOCK");
  }

  // Spend coins atomically
  const { data: spendResult, error: spendError } = await adminSupabase.rpc("spend_game_coins", {
    p_client_id: user.id,
    p_amount: storeItem.coin_price,
    p_source: "store",
    p_description: `Troca: ${storeItem.name}`,
    p_item_id: storeItem.id,
  });

  if (spendError) {
    throw new AppError("SYS_INTERNAL", spendError.message);
  }

  const result = spendResult as unknown as {
    success: boolean;
    error?: string;
    remaining?: number;
  };

  if (!result.success) {
    if (result.error === "INSUFFICIENT_COINS") {
      throw new AppError("GAME_INSUFFICIENT_COINS");
    }
    throw new AppError("SYS_INTERNAL", result.error);
  }

  // Decrease stock if applicable
  if (storeItem.stock !== null) {
    await adminSupabase
      .from("reward_store_items")
      .update({ stock: storeItem.stock - 1 })
      .eq("id", storeItem.id);
  }

  // Create redemption record
  const { data: redemption, error: redemptionError } = await adminSupabase
    .from("reward_redemptions")
    .insert({
      client_id: user.id,
      item_id: storeItem.id,
      coins_spent: storeItem.coin_price,
      status: storeItem.type === "product" ? "pending" : "fulfilled",
      fulfilled_at: storeItem.type !== "product" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (redemptionError) {
    throw new AppError("RES_CREATE_FAILED", redemptionError.message);
  }

  // Check achievements (non-blocking)
  const { checkAndAwardAchievements } = await import("@/lib/achievements");
  const newAchievements = await checkAndAwardAchievements(user.id, "reward_redeemed").catch(() => []);

  return NextResponse.json({
    success: true,
    redemption_id: (redemption as unknown as { id: string })?.id,
    remaining_coins: result.remaining,
    item_type: storeItem.type,
    new_achievements: newAchievements.map((a) => ({
      name: a.name,
      description: a.description,
      coin_reward: a.coin_reward,
    })),
  });
});
