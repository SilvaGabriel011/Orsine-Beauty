import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlotsWithReason } from "@/lib/availability";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler } from "@/lib/errors";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const GET = withErrorHandler(async (request: NextRequest) => {
  const serviceId = request.nextUrl.searchParams.get("serviceId");
  const date = request.nextUrl.searchParams.get("date");
  const durationParam = request.nextUrl.searchParams.get("duration");

  if (!date) {
    throw new AppError("VAL_MISSING_FIELDS", "date e obrigatorio");
  }

  if (!serviceId && !durationParam) {
    throw new AppError("VAL_MISSING_FIELDS", "serviceId ou duration sao obrigatorios");
  }

  // Validate date format
  if (!dateRegex.test(date)) {
    throw new AppError("VAL_INVALID_FORMAT", "Formato de data invalido. Use YYYY-MM-DD");
  }

  // Validate date is a real calendar date
  const dateObj = new Date(date + "T12:00:00");
  if (isNaN(dateObj.getTime())) {
    throw new AppError("VAL_INVALID_FORMAT", "Data invalida");
  }

  // Validate UUID format if serviceId provided
  if (serviceId && !uuidRegex.test(serviceId)) {
    throw new AppError("VAL_INVALID_ID", "serviceId invalido");
  }

  let durationMinutes: number;

  if (durationParam) {
    // Direct duration param (used by cart/checkout)
    durationMinutes = parseInt(durationParam, 10);
    if (isNaN(durationMinutes) || durationMinutes <= 0 || durationMinutes > 1440) {
      throw new AppError("VAL_INVALID_FORMAT", "Duracao invalida");
    }
  } else {
    // Lookup service duration (legacy single-service flow)
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

  const result = await getAvailableSlotsWithReason(date, durationMinutes);

  return NextResponse.json({
    date,
    slots: result.slots,
    unavailableReason: result.unavailableReason,
  });
});
