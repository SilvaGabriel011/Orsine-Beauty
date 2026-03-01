import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAuth } from "@/lib/errors";
import { z } from "zod";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createReviewSchema = z.object({
  appointment_id: z.string().regex(uuidRegex, "appointment_id invalido"),
  rating: z.number().int().min(1, "Nota minima e 1").max(5, "Nota maxima e 5"),
  comment: z.string().max(2000).optional().nullable(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const serviceId = request.nextUrl.searchParams.get("serviceId");
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam || "10"), 1), 50);

  // Validate UUID format if provided
  if (serviceId && !uuidRegex.test(serviceId)) {
    throw new AppError("VAL_INVALID_ID", "serviceId invalido");
  }

  let query = (supabase.from("reviews") as any)
    .select("*, profiles(full_name)")
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (serviceId) {
    query = query.eq("service_id", serviceId);
  }

  const { data, error } = (await query) as { data: any[] | null; error: any };

  if (error) {
    throw new AppError("SYS_DATABASE", error.message, error);
  }

  return NextResponse.json(data);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const body = await request.json();

  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || "Dados invalidos";
    throw new AppError("VAL_INVALID_FORMAT", firstError);
  }

  const { appointment_id, rating, comment } = parsed.data;

  // Fetch appointment and validate
  const { data: appointment } = (await (supabase.from("appointments") as any)
    .select(
      "id, client_id, status, service_id, appointment_services(service_id)"
    )
    .eq("id", appointment_id)
    .single()) as { data: any | null };

  if (!appointment) {
    throw new AppError("APPT_NOT_FOUND");
  }

  if (appointment.client_id !== user.id) {
    throw new AppError("REV_NOT_OWNER");
  }

  if (appointment.status !== "completed") {
    throw new AppError("REV_NOT_COMPLETED");
  }

  // Check for existing review
  const { data: existingReview } = (await (supabase.from("reviews") as any)
    .select("id")
    .eq("appointment_id", appointment_id)
    .single()) as { data: any | null };

  if (existingReview) {
    throw new AppError("REV_ALREADY_REVIEWED");
  }

  // Determine service_id: from appointment_services or legacy
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

  // Auto-approve: rating >= 4 is visible, 1-3 needs admin approval
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
