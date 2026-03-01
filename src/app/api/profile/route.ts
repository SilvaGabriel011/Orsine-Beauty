import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAuth } from "@/lib/errors";

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const { data: profile, error } = (await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()) as unknown as { data: any | null; error: any };

  if (error) {
    throw new AppError("SYS_DATABASE", error.message, error);
  }

  return NextResponse.json(profile);
});

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const body = await request.json();

  // Only allow updating certain fields
  const allowedFields = ["full_name", "phone"];
  const updateData: Record<string, any> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      updateData[key] = body[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError("VAL_MISSING_FIELDS", "Nenhum campo para atualizar");
  }

  const { data, error } = (await (supabase.from("profiles") as any)
    .update(updateData)
    .eq("id", user.id)
    .select()
    .single()) as { data: any | null; error: any };

  if (error) {
    throw new AppError("RES_UPDATE_FAILED", error.message, error);
  }

  return NextResponse.json(data);
});
