import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAdmin } from "@/lib/errors/auth-helpers";
import { AppError } from "@/lib/errors/app-error";

const createItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  type: z.enum(["discount", "service", "product"]),
  coin_price: z.number().int().min(1),
  stock: z.number().int().min(0).nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const body = await request.json();
  const parsed = createItemSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError("VAL_INVALID_FORMAT");
  }

  const adminSupabase = createAdminClient();
  const { data: item, error } = await adminSupabase
    .from("reward_store_items")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description,
      type: parsed.data.type,
      coin_price: parsed.data.coin_price,
      stock: parsed.data.stock ?? null,
      metadata: parsed.data.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new AppError("RES_CREATE_FAILED", error.message);
  }

  return NextResponse.json({ item }, { status: 201 });
});
