import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteCalendarEvent } from "@/lib/google-calendar";
import { sendEmail, buildCancellationEmail } from "@/lib/notifications";
import { awardLoyaltyPoints } from "@/lib/loyalty";
import { AppError, withErrorHandler, requireAuth, logger } from "@/lib/errors";

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

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const { id } = (await context!.params) as { id: string };
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const body = await request.json();

  // If cancelling, check 24h policy
  if (body.status === "cancelled") {
    const { data: appointment } = (await (supabase
      .from("appointments") as any)
      .select(
        "appointment_date, start_time, google_event_id, profiles(full_name, email), services(name, price, duration_minutes), appointment_services(services(name, price, duration_minutes))"
      )
      .eq("id", id)
      .single()) as { data: any | null };

    if (appointment) {
      const appointmentDate = new Date(
        `${appointment.appointment_date}T${appointment.start_time}`
      );
      const now = new Date();
      const hoursUntil =
        (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntil < 24) {
        throw new AppError("APPT_CANCEL_TOO_LATE");
      }

      // Delete Google Calendar event (non-blocking)
      if (appointment.google_event_id) {
        try {
          await deleteCalendarEvent(appointment.google_event_id);
        } catch (calErr) {
          logger.warn("Google Calendar delete error (non-blocking)", { code: "INT_CALENDAR_FAILED", details: calErr });
        }
      }

      // Send cancellation email (non-blocking)
      try {
        const clientEmail = appointment.profiles?.email;
        const clientName = appointment.profiles?.full_name || "Cliente";

        if (clientEmail) {
          // Collect services from appointment_services or fallback to single service
          const services: { name: string; price: number; duration_minutes: number }[] = [];
          if (appointment.appointment_services?.length > 0) {
            for (const as_ of appointment.appointment_services) {
              if (as_.services) services.push(as_.services);
            }
          } else if (appointment.services) {
            services.push(appointment.services);
          }

          if (services.length > 0) {
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

    // Cancel pending notifications
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

  // Award loyalty points when appointment is completed
  if (body.status === "completed" && data) {
    try {
      await awardLoyaltyPoints(id, data.client_id, data.amount_paid || 0);
    } catch (loyaltyErr) {
      logger.warn("Loyalty points error (non-blocking)", { code: "SYS_INTERNAL", details: loyaltyErr });
    }
  }

  return NextResponse.json(data);
});
