import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAdmin } from "@/lib/errors";

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();

  const { data, error } = (await (supabase.from("loyalty_rules") as any)
    .select("*")
    .order("type")
    .order("created_at", { ascending: false })) as {
    data: any[] | null;
    error: any;
  };

  if (error) {
    throw new AppError("SYS_DATABASE", error.message, error);
  }

  return NextResponse.json(data);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const body = await request.json();

  const { data, error } = (await (supabase.from("loyalty_rules") as any)
    .insert(body)
    .select()
    .single()) as { data: any | null; error: any };

  if (error) {
    throw new AppError("RES_CREATE_FAILED", error.message, error);
  }

  return NextResponse.json(data, { status: 201 });
});
