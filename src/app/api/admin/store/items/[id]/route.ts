import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAdmin } from "@/lib/errors/auth-helpers";
import { AppError } from "@/lib/errors/app-error";

export const PATCH = withErrorHandler(
  async (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ) => {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const params = await context!.params;
    const id = params.id;

    const body = await request.json();
    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from("reward_store_items")
      .update(body)
      .eq("id", id);

    if (error) {
      throw new AppError("RES_UPDATE_FAILED", error.message);
    }

    return NextResponse.json({ success: true });
  }
);

export const DELETE = withErrorHandler(
  async (
    _request: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ) => {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const params = await context!.params;
    const id = params.id;

    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from("reward_store_items")
      .delete()
      .eq("id", id);

    if (error) {
      throw new AppError("RES_DELETE_FAILED", error.message);
    }

    return NextResponse.json({ success: true });
  }
);
