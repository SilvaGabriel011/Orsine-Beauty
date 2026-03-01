import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAuth } from "@/lib/errors/auth-helpers";
import { AppError } from "@/lib/errors/app-error";

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  await requireAuth(supabase);

  const { data: items, error } = await supabase
    .from("reward_store_items")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new AppError("SYS_DATABASE", error.message);
  }

  return NextResponse.json({ items: items || [] });
});
