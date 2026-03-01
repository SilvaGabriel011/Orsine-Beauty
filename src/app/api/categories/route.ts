import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAdmin } from "@/lib/errors";
import { z } from "zod";
import type { Category } from "@/types/database";

const createCategorySchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio").max(100),
  slug: z.string().min(1, "Slug e obrigatorio").max(100).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minusculas, numeros e hifens"),
  description: z.string().max(500).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().min(0).optional().default(0),
});

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();

  const { data, error } = (await supabase
    .from("categories")
    .select("*")
    .order("sort_order")) as unknown as { data: Category[] | null; error: any };

  if (error) {
    throw new AppError("SYS_DATABASE", error.message, error);
  }

  return NextResponse.json(data);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const body = await request.json();

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || "Dados invalidos";
    throw new AppError("VAL_INVALID_FORMAT", firstError);
  }

  const { name, slug, description, image_url, is_active, sort_order } = parsed.data;

  const { data, error } = (await (supabase
    .from("categories") as any)
    .insert({ name, slug, description, image_url, is_active, sort_order })
    .select()
    .single()) as { data: Category | null; error: any };

  if (error) {
    if (error.code === "23505") {
      throw new AppError("RES_ALREADY_EXISTS", "Ja existe uma categoria com este slug");
    }
    throw new AppError("RES_CREATE_FAILED", error.message, error);
  }

  return NextResponse.json(data, { status: 201 });
});
