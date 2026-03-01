/**
 * API Route: /api/reviews
 *
 * Gerencia avaliacoes (reviews) de clientes sobre servicos.
 *
 * GET  — Lista avaliacoes visiveis (rating >= 4 auto-aprovadas, 1-3 aguardando admin)
 * POST — Cliente submete avaliacao apos agendamento completado
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAuth } from "@/lib/errors";
import { z } from "zod";

// Padrao de validacao para UUID
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Schema de validacao para criar avaliacao
const createReviewSchema = z.object({
  appointment_id: z.string().regex(uuidRegex, "appointment_id invalido"),
  rating: z.number().int().min(1, "Nota minima e 1").max(5, "Nota maxima e 5"),
  comment: z.string().max(2000).optional().nullable(),
});

// GET: Lista avaliacoes visiveis (filtro auto-aprovacao por rating)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const serviceId = request.nextUrl.searchParams.get("serviceId");
  const limitParam = request.nextUrl.searchParams.get("limit");
  // Garante limit entre 1 e 50 para evitar abuso
  const limit = Math.min(Math.max(parseInt(limitParam || "10"), 1), 50);

  // Validacao: se serviceId fornecido, deve ser UUID valido
  if (serviceId && !uuidRegex.test(serviceId)) {
    throw new AppError("VAL_INVALID_ID", "serviceId invalido");
  }

  // Busca apenas avaliacoes visiveis, ordenadas por recentes
  let query = (supabase.from("reviews") as any)
    .select("*, profiles(full_name)")
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Filtro opcional por servico
  if (serviceId) {
    query = query.eq("service_id", serviceId);
  }

  const { data, error } = (await query) as { data: any[] | null; error: any };

  if (error) {
    throw new AppError("SYS_DATABASE", error.message, error);
  }

  return NextResponse.json(data);
});

// POST: Cliente submete avaliacao apos agendamento (requer autenticacao)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const body = await request.json();

  // Validacao com Zod: appointment_id, rating (1-5), comentario opcional
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || "Dados invalidos";
    throw new AppError("VAL_INVALID_FORMAT", firstError);
  }

  const { appointment_id, rating, comment } = parsed.data;

  // Busca agendamento para validacoes
  const { data: appointment } = (await (supabase.from("appointments") as any)
    .select(
      "id, client_id, status, service_id, appointment_services(service_id)"
    )
    .eq("id", appointment_id)
    .single()) as { data: any | null };

  if (!appointment) {
    throw new AppError("APPT_NOT_FOUND");
  }

  // Validacao: cliente so pode avaliar seus proprios agendamentos
  if (appointment.client_id !== user.id) {
    throw new AppError("REV_NOT_OWNER");
  }

  // Validacao: agendamento deve estar completo para avaliar
  if (appointment.status !== "completed") {
    throw new AppError("REV_NOT_COMPLETED");
  }

  // Validacao: apenas uma avaliacao por agendamento
  const { data: existingReview } = (await (supabase.from("reviews") as any)
    .select("id")
    .eq("appointment_id", appointment_id)
    .single()) as { data: any | null };

  if (existingReview) {
    throw new AppError("REV_ALREADY_REVIEWED");
  }

  // Extrai service_id: pode vir de campo legado ou da junction table
  let serviceId = appointment.service_id;
  if (
    !serviceId &&
    appointment.appointment_services?.length > 0
  ) {
    serviceId = appointment.appointment_services[0].service_id;
  }

  if (!serviceId) {
    throw new AppError("REV_NO_SERVICE");
  }

  // Auto-aprovacao: rating >= 4 e visivel imediatamente, 1-3 aguarda admin
  const isVisible = rating >= 4;

  const { data: review, error } = (await (supabase.from("reviews") as any)
    .insert({
      appointment_id,
      client_id: user.id,
      service_id: serviceId,
      rating,
      comment: comment || null,
      is_visible: isVisible,
    })
    .select()
    .single()) as { data: any | null; error: any };

  if (error) {
    throw new AppError("RES_CREATE_FAILED", error.message, error);
  }

  return NextResponse.json(review, { status: 201 });
});
