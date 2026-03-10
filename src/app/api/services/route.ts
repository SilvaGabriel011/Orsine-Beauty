/**
 * API Route: /api/services
 *
 * Gerencia servicos disponiveis para agendamento.
 *
 * GET  — Lista servicos, opcionalmente filtrados por categoria
 * POST — Cria novo servico (requer admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAdmin } from "@/lib/errors";
import { z } from "zod";

// Padrao de validacao para UUID
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Schema de validacao para criar/atualizar servico
const createServiceSchema = z.object({
  category_id: z.string().regex(uuidRegex, "category_id invalido"),
  name: z.string().min(1, "Nome e obrigatorio").max(200),
  description: z.string().max(1000).optional().nullable(),
  duration_minutes: z.number().int().min(5).max(480).optional().default(40),
  price: z.number().min(0, "Preco deve ser positivo"),
  image_url: z.string().url().optional().nullable(),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().min(0).optional().default(0),
});

// GET: Lista servicos com relacao para categoria, opcionalmente filtrado
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const categoryId = request.nextUrl.searchParams.get("categoryId");

  // Validacao: se categoryId fornecido, deve ser UUID valido
  if (categoryId && !uuidRegex.test(categoryId)) {
    throw new AppError("VAL_INVALID_ID", "categoryId invalido");
  }

  // Query dinamica: busca servicos com categoria relacionada, ordenado por sort_order
  let query = (supabase
    .from("services") as any)
    .select("*, categories(id, name, slug)")
    .order("sort_order");

  // Filtro opcional por categoria
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = (await query) as unknown as { data: any[] | null; error: any };

  if (error) {
    throw new AppError("SYS_DATABASE", error.message, error);
  }

  return NextResponse.json(data);
});

// POST: Cria novo servico (requer admin) - valida category_id, preco, duracao
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  // Verifica permissao de admin
  await requireAdmin(supabase);

  const body = await request.json();

  // Validacao com Zod: categoria, nome, preco, duracao (40min default)
  const parsed = createServiceSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || "Dados invalidos";
    throw new AppError("VAL_INVALID_FORMAT", firstError);
  }

  const {
    category_id,
    name,
    description,
    duration_minutes,
    price,
    image_url,
    is_active,
    sort_order,
  } = parsed.data;

  // Insercao do servico na BD
  const { data, error } = (await (supabase
    .from("services") as any)
    .insert({
      category_id,
      name,
      description,
      duration_minutes,
      price,
      image_url,
      is_active,
      sort_order,
    })
    .select("*, categories(id, name, slug)")
    .single()) as { data: any | null; error: any };

  if (error) {
    throw new AppError("RES_CREATE_FAILED", error.message, error);
  }

  return NextResponse.json(data, { status: 201 });
});
