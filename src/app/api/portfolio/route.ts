import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAdmin } from "@/lib/errors";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const categoryId = request.nextUrl.searchParams.get("categoryId");

  let query = (supabase.from("portfolio") as any)
    .select("*, categories(id, name, slug)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = (await query) as { data: any[] | null; error: any };

  if (error) {
    throw new AppError("SYS_DATABASE", error.message, error);
  }

  return NextResponse.json(data);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const body = await request.json();

  const { data, error } = (await (supabase.from("portfolio") as any)
    .insert(body)
    .select("*, categories(id, name, slug)")
    .single()) as { data: any | null; error: any };

  if (error) {
    throw new AppError("RES_CREATE_FAILED", error.message, error);
  }

  return NextResponse.json(data, { status: 201 });
});
