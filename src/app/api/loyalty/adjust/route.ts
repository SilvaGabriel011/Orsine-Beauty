import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppError, withErrorHandler, requireAdmin } from "@/lib/errors";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const body = await request.json();
  const { client_id, points, description } = body;

  if (!client_id || points === undefined || points === 0) {
    throw new AppError("VAL_MISSING_FIELDS", "client_id e points sao obrigatorios");
  }

  const adminSupabase = createAdminClient();

  // Get current points
  const { data: clientProfile } = (await (adminSupabase
    .from("profiles") as any)
    .select("loyalty_points")
    .eq("id", client_id)
    .single()) as { data: { loyalty_points: number } | null };

  if (!clientProfile) {
    throw new AppError("RES_NOT_FOUND", "Cliente nao encontrado");
  }

  const newPoints = Math.max(0, (clientProfile.loyalty_points || 0) + points);

  // Update points
  await (adminSupabase.from("profiles") as any)
    .update({ loyalty_points: newPoints })
    .eq("id", client_id);

  // Insert history
  await (adminSupabase.from("loyalty_history") as any).insert({
    client_id,
    type: points > 0 ? "adjustment_add" : "adjustment_remove",
    points,
    description: description || `Ajuste manual pelo admin`,
  });

  return NextResponse.json({ loyalty_points: newPoints });
});
