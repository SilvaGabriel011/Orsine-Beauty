import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAdmin } from "@/lib/errors/auth-helpers";
import { AppError } from "@/lib/errors/app-error";

const updateSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
});

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError("VAL_INVALID_FORMAT");
  }

  const adminSupabase = createAdminClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.is_active !== undefined) {
    updateData.is_active = parsed.data.is_active;
  }
  if (parsed.data.config) {
    updateData.config = parsed.data.config;
  }

  const { error } = await adminSupabase
    .from("game_config")
    .update(updateData)
    .eq("id", parsed.data.id);

  if (error) {
    throw new AppError("RES_UPDATE_FAILED", error.message);
  }

  return NextResponse.json({ success: true });
});
