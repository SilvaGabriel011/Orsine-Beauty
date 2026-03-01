/**
 * API Route: /api/appointments/[id]/cancel-link
 *
 * Permite cancelar um agendamento via link com token.
 * Valida token e política de 24h antes de cancelar.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteCalendarEvent } from "@/lib/google-calendar";
import { sendEmail, buildCancellationEmail } from "@/lib/notifications";
import { validateCancelToken } from "@/lib/tokens";
import { AppError, withErrorHandler, logger } from "@/lib/errors";
import { getAdelaideNow, adelaideDateTime } from "@/lib/timezone";

// POST: Cancela appointment usando token
export const POST = withErrorHandler(async (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const { id } = (await context!.params) as { id: string };
  const supabase = await createClient();

  const body = await request.json();
  const { token } = body;

  if (!token) {
    throw new AppError("VAL_MISSING_TOKEN");
  }

  // Validar token JWT
  let tokenPayload;
  try {
    tokenPayload = await validateCancelToken(token);
  } catch (err) {
    throw new AppError("AUTH_INVALID_TOKEN");
  }

  // Verificar se token corresponde ao appointment
  if (tokenPayload.appointmentId !== id) {
    throw new AppError("AUTH_TOKEN_MISMATCH");
  }

  // Buscar appointment atual
  const { data: appointment, error: fetchError } = (await (supabase
    .from("appointments") as any)
    .select(`
      *,
      services(id, name, price, duration_minutes),
      profiles(id, full_name, email),
      appointment_services(services(id, name, price, duration_minutes))
    `)
    .eq("id", id)
    .single()) as { data: any | null; error: any };

  if (fetchError || !appointment) {
    throw new AppError("APPT_NOT_FOUND", fetchError?.message);
  }

  // Verificar se o cliente do token é o dono do appointment
  if (appointment.client_id !== tokenPayload.clientId) {
    throw new AppError("AUTH_UNAUTHORIZED");
  }

  // Verificar se appointment pode ser cancelado
  if (["cancelled", "completed", "no_show"].includes(appointment.status)) {
    throw new AppError("APPT_INVALID_STATUS");
  }

  // Validar política de 24h
  const appointmentDate = adelaideDateTime(appointment.appointment_date, appointment.start_time);
  const now = getAdelaideNow();
  const hoursUntil = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntil < 24) {
    throw new AppError("APPT_CANCEL_TOO_LATE");
  }

  // Deletar evento no Google Calendar (non-blocking)
  if (appointment.google_event_id) {
    try {
      await deleteCalendarEvent(appointment.google_event_id);
    } catch (calErr) {
      logger.warn("Google Calendar delete error (non-blocking)", { 
        code: "INT_CALENDAR_FAILED", 
        details: calErr 
      });
    }
  }

  // Atualizar status para cancelled
  const { data: updated, error: updateError } = (await (supabase
    .from("appointments") as any)
    .update({ 
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(`
      *,
      services(id, name, price, duration_minutes),
      profiles(id, full_name, email),
      appointment_services(services(id, name, price, duration_minutes))
    `)
    .single()) as { data: any | null; error: any };

  if (updateError || !updated) {
    throw new AppError("RES_UPDATE_FAILED", updateError?.message);
  }

  // Enviar email de confirmação (non-blocking)
  try {
    const clientEmail = appointment.profiles?.email;
    const clientName = appointment.profiles?.full_name || "Cliente";

    if (clientEmail) {
      const services = appointment.appointment_services?.length > 0
        ? appointment.appointment_services.map((as_: any) => as_.services).filter(Boolean)
        : appointment.services ? [appointment.services] : [];

      const formattedDate = new Date(
        `${appointment.appointment_date}T12:00:00`
      ).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const emailData = buildCancellationEmail({
        clientName,
        services,
        date: formattedDate,
        time: appointment.start_time.substring(0, 5),
      });

      emailData.to = clientEmail;
      await sendEmail(emailData);
    }
  } catch (emailErr) {
    logger.warn("Cancellation email error (non-blocking)", { 
      code: "INT_EMAIL_FAILED", 
      details: emailErr 
    });
  }

  // Marcar notificações pendentes como canceladas
  await (supabase
    .from("notifications") as any)
    .update({ status: "cancelled" })
    .eq("appointment_id", id)
    .eq("status", "pending");

  return NextResponse.json({ 
    success: true,
    message: "Agendamento cancelado com sucesso"
  });
});
