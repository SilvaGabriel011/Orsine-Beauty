/**
 * API Route: /api/availability
 *
 * Calcula horarios disponiveis para agendamentos.
 *
 * GET — Retorna lista de slots disponiveis para uma data, considerando
 *       duracao do servico, horario de funcionamento e agendamentos existentes
 */

import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlotsWithReason } from "@/lib/availability";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler } from "@/lib/errors";

// Padroes de validacao: UUID e formato de data (YYYY-MM-DD)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// GET: Calcula horarios disponiveis dado a data e duracao (ou servico)
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Extrai parametros: data (obrigatoria), duracao ou servico_id
  const serviceId = request.nextUrl.searchParams.get("serviceId");
  const date = request.nextUrl.searchParams.get("date");
  const durationParam = request.nextUrl.searchParams.get("duration");

  // Validacao: data e obrigatoria
  if (!date) {
    throw new AppError("VAL_MISSING_FIELDS", "date e obrigatorio");
  }

  // Validacao: precisa de duracao (via parametro) ou servico_id (para buscar duracao)
  if (!serviceId && !durationParam) {
    throw new AppError("VAL_MISSING_FIELDS", "serviceId ou duration sao obrigatorios");
  }

  // Validacao de formato: data deve ser YYYY-MM-DD
  if (!dateRegex.test(date)) {
    throw new AppError("VAL_INVALID_FORMAT", "Formato de data invalido. Use YYYY-MM-DD");
  }

  // Validacao de data valida no calendario
  const dateObj = new Date(date + "T12:00:00");
  if (isNaN(dateObj.getTime())) {
    throw new AppError("VAL_INVALID_FORMAT", "Data invalida");
  }

  // Validacao: se serviceId fornecido, deve ser UUID valido
  if (serviceId && !uuidRegex.test(serviceId)) {
    throw new AppError("VAL_INVALID_ID", "serviceId invalido");
  }

  let durationMinutes: number;

  if (durationParam) {
    // Se duracao fornecida diretamente (fluxo: carrinho/checkout com multiplos servicos)
    durationMinutes = parseInt(durationParam, 10);
    if (isNaN(durationMinutes) || durationMinutes <= 0 || durationMinutes > 1440) {
      throw new AppError("VAL_INVALID_FORMAT", "Duracao invalida");
    }
  } else {
    // Busca duracao do servico na BD (fluxo legado: servico unico)
    const supabase = await createClient();
    const { data: service, error } = (await (supabase
      .from("services") as any)
      .select("duration_minutes")
      .eq("id", serviceId)
      .eq("is_active", true)
      .single()) as { data: { duration_minutes: number } | null; error: any };

    if (error || !service) {
      throw new AppError("APPT_SERVICE_NOT_FOUND");
    }

    durationMinutes = service.duration_minutes;
  }

  // Chama funcao de calculo de disponibilidade - retorna slots e motivo se indisponivel
  const result = await getAvailableSlotsWithReason(date, durationMinutes);

  return NextResponse.json({
    date,
    slots: result.slots,
    unavailableReason: result.unavailableReason,
  });
});
