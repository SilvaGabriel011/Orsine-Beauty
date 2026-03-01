import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAuth } from "@/lib/errors";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const { id } = (await context!.params) as { id: string };
  const supabase = await createClient();

  const { data, error } = (await supabase
    .from("categories")
    .select("*, services(*)")
    .eq("id", id)
    .single()) as unknown as { data: any | null; error: any };

  if (error) {
    throw new AppError("RES_NOT_FOUND", error.message, error);
  }

  return NextResponse.json(data);
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const { id } = (await context!.params) as { id: string };
  const supabase = await createClient();
  await requireAuth(supabase);

  const body = await request.json();

  const { data, error } = (await (supabase
    .from("categories") as any)
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
  await requireAuth(supabase);

  // Soft delete - just deactivate
  const { error } = await (supabase
    .from("categories") as any)
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    throw new AppError("RES_DELETE_FAILED", error.message, error);
  }

  return NextResponse.json({ success: true });
});
