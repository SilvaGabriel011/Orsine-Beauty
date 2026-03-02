/**
 * API Route: /api/appointments/[id]/reschedule
 *
 * Permite reagendar um appointment existente para nova data/hora.
 * Valida política de 24h, verifica disponibilidade e atualiza Google Calendar.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateCalendarEvent } from "@/lib/google-calendar";
import { sendEmail, buildRescheduleEmail } from "@/lib/notifications";
import { AppError, withErrorHandler, requireAuth, logger } from "@/lib/errors";
import { getAdelaideNow, adelaideDateTime } from "@/lib/timezone";
import { z } from "zod";

const rescheduleSchema = z.object({
  new_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido"),
  new_start_time: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
  new_end_time: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
});

// PATCH: Reagenda appointment para nova data/hora
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const { id } = (await context!.params) as { id: string };
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const body = await request.json();
  const parsed = rescheduleSchema.safeParse(body);
  
  if (!parsed.success) {
    throw new AppError("VAL_INVALID_FORMAT");
  }

  const { new_date, new_start_time, new_end_time } = parsed.data;

  // Buscar appointment atual com relações
  const { data: appointment, error: fetchError } = (await (supabase
    .from("appointments") as any)
    .select(`
      *,
      services(id, name, price, duration_minutes),
      profiles(id, full_name, email),
      appointment_services(
        service_id,
        services(id, name, price, duration_minutes)
      )
    `)
    .eq("id", id)
    .single()) as { data: any | null; error: any };

  if (fetchError || !appointment) {
    throw new AppError("APPT_NOT_FOUND", fetchError?.message);
  }

  // Verificar se appointment pode ser alterado (não cancelado/completado)
  if (["cancelled", "completed", "no_show"].includes(appointment.status)) {
    throw new AppError("APPT_INVALID_STATUS");
  }

  // Verificar política de 24h para reagendamento
  const appointmentDateTime = adelaideDateTime(
    appointment.appointment_date,
    appointment.start_time
  );
  const now = getAdelaideNow();
  const hoursUntil = appointmentDateTime.diff(now, "hours").hours;

  if (hoursUntil < 24) {
    throw new AppError(
      "VAL_INVALID_DATE",
      "Não é possível reagendar com menos de 24h de antecedência"
    );
  }

  const newDateTime = adelaideDateTime(new_date, new_start_time);
  const hoursUntilNew = (newDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilNew < 24) {
    throw new AppError("APPT_RESCHEDULE_TOO_SOON");
  }

  // Verificar disponibilidade do novo horário
  // Primeiro, verificar blocked_slots
  const { data: blockedSlot } = await (supabase
    .from("blocked_slots") as any)
    .select("id")
    .eq("date", new_date)
    .lt("start_time", new_end_time)
    .gt("end_time", new_start_time)
    .single();

  if (blockedSlot) {
    throw new AppError("SLOT_UNAVAILABLE");
  }

  // Verificar double booking com other appointments
  const { data: conflict } = await (supabase
    .from("appointments") as any)
    .select("id")
    .eq("appointment_date", new_date)
    .neq("id", id) // Excluir o appointment atual
    .in("status", ["pending", "confirmed"])
    .or(`start_time.lt.${new_end_time},end_time.gt.${new_start_time}`)
    .maybeSingle();

  if (conflict) {
    throw new AppError("SLOT_DOUBLE_BOOKING");
  }

  // Atualizar appointment no banco
  const { data: updated, error: updateError } = (await (supabase
    .from("appointments") as any)
    .update({
      appointment_date: new_date,
      start_time: new_start_time,
      end_time: new_end_time,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(`
      *,
      services(id, name, price, duration_minutes),
      profiles(id, full_name, email),
      appointment_services(
        service_id,
        services(id, name, price, duration_minutes)
      )
    `)
    .single()) as { data: any | null; error: any };

  if (updateError || !updated) {
    throw new AppError("RES_UPDATE_FAILED", updateError?.message);
  }

  // Atualizar evento no Google Calendar (non-blocking)
  if (appointment.google_event_id) {
    try {
      await updateCalendarEvent(appointment.google_event_id, {
        date: new_date,
        startTime: new_start_time,
        endTime: new_end_time,
        services: appointment.appointment_services?.length > 0 
          ? appointment.appointment_services.map((as_: any) => as_.services?.name).filter(Boolean)
          : [appointment.services?.name].filter(Boolean),
      });
    } catch (calErr) {
      logger.warn("Google Calendar update error (non-blocking)", { 
        code: "INT_CALENDAR_FAILED", 
        details: calErr 
      });
    }
  }

  // Enviar email de confirmação de reagendamento (non-blocking)
  try {
    const clientEmail = appointment.profiles?.email;
    const clientName = appointment.profiles?.full_name || "Cliente";

    if (clientEmail) {
      const services = appointment.appointment_services?.length > 0
        ? appointment.appointment_services.map((as_: any) => as_.services).filter(Boolean)
        : appointment.services ? [appointment.services] : [];

      const oldDate = new Date(`${appointment.appointment_date}T12:00:00`).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const newDate = new Date(`${new_date}T12:00:00`).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const emailData = buildRescheduleEmail({
        clientName,
        services,
        oldDate,
        oldTime: appointment.start_time.substring(0, 5),
        newDate,
        newTime: new_start_time.substring(0, 5),
      });

      emailData.to = clientEmail;
      await sendEmail(emailData);
    }
  } catch (emailErr) {
    logger.warn("Reschedule email error (non-blocking)", { 
      code: "INT_EMAIL_FAILED", 
      details: emailErr 
    });
  }

  // Reagendar notificações pendentes
  await (supabase
    .from("notifications") as any)
    .update({ status: "cancelled" })
    .eq("appointment_id", id)
    .eq("status", "pending");

  // Criar novas notificações para o novo horário
  const newAppointmentDateTime = adelaideDateTime(new_date, new_start_time);
  const reminder24h = new Date(newAppointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
  const reminder2h = new Date(newAppointmentDateTime.getTime() - 2 * 60 * 60 * 1000);

  if (reminder24h > now) {
    await (supabase
      .from("notifications") as any)
      .insert({
        appointment_id: id,
        type: "reminder_24h",
        scheduled_for: reminder24h.toISOString(),
        status: "pending",
      });
  }

  if (reminder2h > now) {
    await (supabase
      .from("notifications") as any)
      .insert({
        appointment_id: id,
        type: "reminder_2h",
        scheduled_for: reminder2h.toISOString(),
        status: "pending",
      });
  }

  return NextResponse.json(updated);
});
