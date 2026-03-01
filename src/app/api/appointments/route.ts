import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCalendarEvent } from "@/lib/google-calendar";
import { sendEmail, buildConfirmationEmail } from "@/lib/notifications";
import { AppError, withErrorHandler, requireAuth, requireAdmin, logger } from "@/lib/errors";
import { z } from "zod";

const APPOINTMENT_SELECT = `
  *,
  services(id, name, price, duration_minutes, categories(id, name)),
  profiles(id, full_name, phone, email),
  appointment_services(id, service_id, price_at_booking, duration_at_booking, services(id, name, price, duration_minutes, categories(id, name)))
`;

// ── Zod Schemas ────────────────────────────────────────────
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const createAppointmentSchema = z.object({
  service_id: z.string().regex(uuidRegex, "service_id invalido").optional(),
  services: z.array(z.object({
    service_id: z.string().regex(uuidRegex).optional(),
    id: z.string().regex(uuidRegex).optional(),
  })).optional(),
  appointment_date: z.string().regex(dateRegex, "Formato de data invalido (YYYY-MM-DD)"),
  start_time: z.string().regex(timeRegex, "Formato de hora invalido (HH:MM)"),
  end_time: z.string().regex(timeRegex, "Formato de hora invalido (HH:MM)"),
  payment_method: z.enum(["online", "presencial"]).optional(),
  notes: z.string().max(1000).optional().nullable(),
  discount_applied: z.number().min(0).optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const status = request.nextUrl.searchParams.get("status");
  const date = request.nextUrl.searchParams.get("date");
  const clientId = request.nextUrl.searchParams.get("clientId");

  // Authorization: clients can only see their own appointments
  let isAdmin = false;
  try {
    await requireAdmin(supabase);
    isAdmin = true;
  } catch {
    // Not admin — that's ok, just restrict to own data
  }

  if (clientId && clientId !== user.id && !isAdmin) {
    throw new AppError("AUTH_NOT_AUTHORIZED", "Voce so pode ver seus proprios agendamentos");
  }

  let query = (supabase
    .from("appointments") as any)
    .select(APPOINTMENT_SELECT)
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (status) {
    query = query.eq("status", status);
  }

  if (date) {
    query = query.eq("appointment_date", date);
  }

  // Non-admin users always filter by their own ID
  if (!isAdmin) {
    query = query.eq("client_id", user.id);
  } else if (clientId) {
    query = query.eq("client_id", clientId);
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

  // Validate input with Zod
  const parsed = createAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || "Dados invalidos";
    throw new AppError("VAL_INVALID_FORMAT", firstError);
  }

  const {
    service_id,
    services: serviceItems,
    appointment_date,
    start_time,
    end_time,
    payment_method,
    notes,
    discount_applied,
  } = parsed.data;

  // Validate appointment_date is not in the past
  const today = new Date().toISOString().split("T")[0];
  if (appointment_date < today) {
    throw new AppError("VAL_INVALID_FORMAT", "Nao e possivel agendar em datas passadas");
  }

  // Determine service IDs
  let serviceIds: string[];
  if (serviceItems && serviceItems.length > 0) {
    serviceIds = serviceItems.map((s) => s.service_id || s.id).filter(Boolean) as string[];
  } else if (service_id) {
    serviceIds = [service_id];
  } else {
    throw new AppError("APPT_MISSING_SERVICES");
  }

  if (serviceIds.length === 0) {
    throw new AppError("APPT_MISSING_SERVICES");
  }

  // Fetch all services
  const { data: fetchedServices } = (await (supabase
    .from("services") as any)
    .select("id, name, price, duration_minutes")
    .in("id", serviceIds)
    .eq("is_active", true)) as { data: any[] | null };

  if (!fetchedServices || fetchedServices.length !== serviceIds.length) {
    throw new AppError("APPT_SERVICE_NOT_FOUND");
  }

  const totalPrice = fetchedServices.reduce(
    (sum: number, s: any) => sum + s.price,
    0
  );
  const totalDuration = fetchedServices.reduce(
    (sum: number, s: any) => sum + s.duration_minutes,
    0
  );
  const safeDiscount = Math.max(0, Math.min(discount_applied || 0, totalPrice));
  const amountPaid = totalPrice - safeDiscount;

  // Application-level conflict check (DB exclusion constraint is the real guard)
  const { data: conflicts } = (await (supabase
    .from("appointments") as any)
    .select("id")
    .eq("appointment_date", appointment_date)
    .neq("status", "cancelled")
    .lt("start_time", end_time)
    .gt("end_time", start_time)) as { data: any[] | null };

  if (conflicts && conflicts.length > 0) {
    throw new AppError("APPT_SLOT_TAKEN");
  }

  // Create appointment — DB exclusion constraint prevents race conditions
  const { data: appointment, error } = (await (supabase
    .from("appointments") as any)
    .insert({
      client_id: user.id,
      service_id: serviceIds.length === 1 ? serviceIds[0] : null,
      appointment_date,
      start_time,
      end_time,
      total_duration: totalDuration,
      status: "confirmed",
      payment_status: payment_method === "online" ? "pending" : "none",
      payment_method: payment_method || "presencial",
      amount_paid: amountPaid,
      discount_applied: safeDiscount,
      notes: notes || null,
    })
    .select()
    .single()) as { data: any | null; error: any };

  if (error) {
    // Handle exclusion constraint violation (double booking)
    if (error.code === "23P01" || error.message?.includes("no_overlapping_appointments")) {
      throw new AppError("APPT_SLOT_TAKEN");
    }
    throw new AppError("RES_CREATE_FAILED", error.message, error);
  }

  // Insert appointment_services (junction table)
  const appointmentServicesData = fetchedServices.map((s: any) => ({
    appointment_id: appointment.id,
    service_id: s.id,
    price_at_booking: s.price,
    duration_at_booking: s.duration_minutes,
  }));

  await (supabase.from("appointment_services") as any).insert(
    appointmentServicesData
  );

  // Schedule reminder notifications (24h and 2h before)
  const appointmentDateTime = new Date(
    `${appointment_date}T${start_time}`
  );
  const reminder24h = new Date(
    appointmentDateTime.getTime() - 24 * 60 * 60 * 1000
  );
  const reminder2h = new Date(
    appointmentDateTime.getTime() - 2 * 60 * 60 * 1000
  );

  // Schedule feedback request 1h after appointment ends
  const appointmentEndTime = new Date(`${appointment_date}T${end_time}`);
  const feedbackTime = new Date(
    appointmentEndTime.getTime() + 1 * 60 * 60 * 1000
  );

  await (supabase.from("notifications") as any).insert([
    {
      appointment_id: appointment.id,
      channel: "email",
      type: "reminder_24h",
      scheduled_for: reminder24h.toISOString(),
    },
    {
      appointment_id: appointment.id,
      channel: "email",
      type: "reminder_2h",
      scheduled_for: reminder2h.toISOString(),
    },
    {
      appointment_id: appointment.id,
      channel: "email",
      type: "feedback_request",
      scheduled_for: feedbackTime.toISOString(),
    },
  ]);

  // --- Google Calendar integration (non-blocking) ---
  const serviceNames = fetchedServices.map((s: any) => s.name).join(", ");
  const startISO = `${appointment_date}T${start_time}`;
  const endISO = `${appointment_date}T${end_time}`;

  try {
    const calendarEventId = await createCalendarEvent({
      summary: `Bela Orsine - ${serviceNames}`,
      description: `Cliente: ${user.user_metadata?.name || user.email}\nServicos: ${serviceNames}\nDuracao: ${totalDuration} min`,
      startDateTime: startISO,
      endDateTime: endISO,
    });

    if (calendarEventId) {
      await (supabase.from("appointments") as any)
        .update({ google_event_id: calendarEventId })
        .eq("id", appointment.id);
    }
  } catch (calErr) {
    logger.warn("Google Calendar error (non-blocking)", { code: "INT_CALENDAR_FAILED", details: calErr });
  }

  // --- Confirmation email (non-blocking) ---
  try {
    const { data: clientProfile } = (await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single()) as unknown as { data: { full_name: string; email: string } | null };

    if (clientProfile?.email) {
      const formattedDate = new Date(
        `${appointment_date}T12:00:00`
      ).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const emailData = buildConfirmationEmail({
        clientName: clientProfile.full_name || "Cliente",
        services: fetchedServices.map((s: any) => ({
          name: s.name,
          price: s.price,
          duration_minutes: s.duration_minutes,
        })),
        date: formattedDate,
        time: start_time.substring(0, 5),
        appointmentId: appointment.id,
      });

      emailData.to = clientProfile.email;
      await sendEmail(emailData);
    }
  } catch (emailErr) {
    logger.warn("Email error (non-blocking)", { code: "INT_EMAIL_FAILED", details: emailErr });
  }

  return NextResponse.json(appointment, { status: 201 });
});
