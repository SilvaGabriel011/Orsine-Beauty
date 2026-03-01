import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAdmin } from "@/lib/errors";

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const { id } = (await context!.params) as { id: string };
  const supabase = await createClient();
  await requireAdmin(supabase);

  const body = await request.json();

  const { data, error } = (await (supabase.from("loyalty_rules") as any)
    .update(body)
    .eq("id", id)
    .select()
    .single()) as { data: any | null; error: any };

  if (error) {
    throw new AppError("RES_UPDATE_FAILED", error.message, error);
  }

  return NextResponse.json(data);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const { id } = (await context!.params) as { id: string };
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { error } = (await (supabase.from("loyalty_rules") as any)
    .delete()
    .eq("id", id)) as { error: any };

  if (error) {
    throw new AppError("RES_DELETE_FAILED", error.message, error);
  }

  return NextResponse.json({ success: true });
});
