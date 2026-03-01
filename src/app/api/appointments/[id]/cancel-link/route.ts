/**
 * API Route: /api/appointments/[id]/cancel-link
 *
 * Permite cancelar um agendamento via link com token.
 * Valida token e política de 24h antes de cancelar.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteCalendarEvent } from "@/lib/google-calendar";
import { sendEmail, buildCancellationEmail, buildAdminCancellationEmail } from "@/lib/notifications";
import { validateCancelToken, type CancelTokenPayload } from "@/lib/tokens";
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
    throw new AppError("VAL_MISSING_FIELDS", "Token não fornecido");
  }

  // Validar token JWT
  let payload: CancelTokenPayload;
  try {
    payload = await validateCancelToken(token);
  } catch {
    throw new AppError("AUTH_INVALID_CREDENTIALS", "Token inválido ou expirado");
  }

  const { appointmentId, clientId } = payload;

  // Verificar se o token corresponde ao appointment informado
  if (appointmentId !== id) {
    throw new AppError("AUTH_NOT_AUTHORIZED", "Token não corresponde ao agendamento");
  }

  // Buscar appointment atual
  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select(`
      *,
      services(id, name, price, duration_minutes),
      profiles(id, full_name, email),
      appointment_services(services(id, name, price, duration_minutes))
    `)
    .eq("id", id)
    .single() as { data: any | null; error: any };

  if (fetchError || !appointment) {
    throw new AppError("RES_NOT_FOUND", fetchError?.message || "Agendamento não encontrado");
  }

  // Verificar se o agendamento pertence ao cliente do token
  if (appointment.client_id !== clientId) {
    throw new AppError("AUTH_NOT_AUTHORIZED", "Não autorizado a cancelar este agendamento");
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

  // Enviar notificacao para o admin (non-blocking)
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    if (adminEmail) {
      const clientName = appointment.client?.full_name || "Cliente";
      const clientEmail = appointment.client?.email || "";
      // Buscar serviços do agendamento
      const { data: servicesData } = await supabase
        .from("appointment_services")
        .select("services(name)")
        .eq("appointment_id", id);
      
      const services = servicesData?.map((as: { services: { name: string } | null }) => as.services?.name).filter(Boolean) as string[] || [];
      
      if (services.length === 0 && appointment.services?.name) {
        services.push(appointment.services.name);
      }
      const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      const adminEmailData = buildAdminCancellationEmail({
        clientName,
        clientEmail,
        clientPhone: appointment.client?.phone || undefined,
        services: services as any[],
        date: formattedDate,
        time: appointment.start_time.substring(0, 5),
      });
      
      adminEmailData.to = adminEmail;
      await sendEmail(adminEmailData);
    }
  } catch (adminEmailErr) {
    logger.warn("Admin cancellation email error (non-blocking)", { 
      code: "INT_EMAIL_FAILED", 
      details: adminEmailErr 
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
