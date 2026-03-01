/**
 * API Route: /api/appointments/[id]
 *
 * Gerencia um agendamento especifico (obter, atualizar).
 *
 * GET   — Obtem detalhes de um agendamento individual
 * PATCH — Atualiza status (completed, cancelled) com validacoes
 *         (cancelamento requer 24h de antecedencia, deleta Google Calendar)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteCalendarEvent } from "@/lib/google-calendar";
import { sendEmail, buildCancellationEmail } from "@/lib/notifications";
import { awardLoyaltyPoints } from "@/lib/loyalty";
import { AppError, withErrorHandler, requireAuth, logger } from "@/lib/errors";
import { getAdelaideNow, adelaideDateTime } from "@/lib/timezone";

// GET: Obtem agendamento com todas as relacoes (cliente, servicos)
export const GET = withErrorHandler(async (
  _request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const { id } = (await context!.params) as { id: string };
  const supabase = await createClient();

  const { data, error } = (await (supabase
    .from("appointments") as any)
    .select(
      "*, services(id, name, price, duration_minutes, categories(id, name)), profiles(id, full_name, phone, email), appointment_services(id, service_id, price_at_booking, duration_at_booking, services(id, name, price, duration_minutes, categories(id, name)))"
    )
    .eq("id", id)
    .single()) as { data: any | null; error: any };

  if (error) {
    throw new AppError("APPT_NOT_FOUND", error.message, error);
  }

  return NextResponse.json(data);
});

// PATCH: Atualiza agendamento (status, etc) com validacoes especiais para cancelamento
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const { id } = (await context!.params) as { id: string };
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const body = await request.json();

  // Logica de cancelamento: valida politica de 24h de antecedencia
  if (body.status === "cancelled") {
    const { data: appointment } = (await (supabase
      .from("appointments") as any)
      .select(
        "appointment_date, start_time, google_event_id, profiles(full_name, email), services(name, price, duration_minutes), appointment_services(services(name, price, duration_minutes))"
      )
      .eq("id", id)
      .single()) as { data: any | null };

    if (appointment) {
      // Calcula tempo restante ate agendamento (considerando fuso Adelaide)
      const appointmentDate = adelaideDateTime(appointment.appointment_date, appointment.start_time);
      const now = getAdelaideNow();
      const hoursUntil =
        (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Politica obrigatoria: 24h de antecedencia para cancelar
      if (hoursUntil < 24) {
        throw new AppError("APPT_CANCEL_TOO_LATE");
      }

      // Deleta evento no Google Calendar (nao-bloqueante)
      if (appointment.google_event_id) {
        try {
          await deleteCalendarEvent(appointment.google_event_id);
        } catch (calErr) {
          logger.warn("Google Calendar delete error (non-blocking)", { code: "INT_CALENDAR_FAILED", details: calErr });
        }
      }

      // Email de confirmacao de cancelamento (nao-bloqueante)
      try {
        const clientEmail = appointment.profiles?.email;
        const clientName = appointment.profiles?.full_name || "Cliente";

        if (clientEmail) {
          // Coleta servicos da junction table (appointment_services) ou fallback para servico unico
          const services: { name: string; price: number; duration_minutes: number }[] = [];
          if (appointment.appointment_services?.length > 0) {
            for (const as_ of appointment.appointment_services) {
              if (as_.services) services.push(as_.services);
            }
          } else if (appointment.services) {
            services.push(appointment.services);
          }

          if (services.length > 0) {
            // Formata data em PT-BR para email amigavel
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
        }
      } catch (emailErr) {
        logger.warn("Cancellation email error (non-blocking)", { code: "INT_EMAIL_FAILED", details: emailErr });
      }
    }

    // Marca todas as notificacoes pendentes deste agendamento como canceladas
    await (supabase
      .from("notifications") as any)
      .update({ status: "cancelled" })
      .eq("appointment_id", id)
      .eq("status", "pending");
  }

  const { data, error } = (await (supabase
    .from("appointments") as any)
    .update(body)
    .eq("id", id)
    .select(
      "*, services(id, name, price, duration_minutes, categories(id, name)), profiles(id, full_name, phone, email), appointment_services(id, service_id, price_at_booking, duration_at_booking, services(id, name, price, duration_minutes, categories(id, name)))"
    )
    .single()) as unknown as { data: any | null; error: any };

  if (error) {
    throw new AppError("RES_UPDATE_FAILED", error.message, error);
  }

  // Premia pontos de fidelidade quando agendamento e concluido (nao-bloqueante)
  if (body.status === "completed" && data) {
    try {
      await awardLoyaltyPoints(id, data.client_id, data.amount_paid || 0);
    } catch (loyaltyErr) {
      logger.warn("Loyalty points error (non-blocking)", { code: "SYS_INTERNAL", details: loyaltyErr });
    }
  }

  return NextResponse.json(data);
});
