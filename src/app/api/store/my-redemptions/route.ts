import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAuth } from "@/lib/errors/auth-helpers";
import { AppError } from "@/lib/errors/app-error";

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("reward_redemptions")
    .select("*, reward_store_items(name, type, image_url)")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("SYS_DATABASE", error.message);
  }

  return NextResponse.json({ redemptions: data || [] });
});
