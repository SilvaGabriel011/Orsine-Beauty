// Supabase Edge Function: send-reminders
// Sends reminder emails (24h and 2h before) for upcoming appointments.
// Schedule: runs every 30 minutes via Supabase cron.
//
// Setup in Supabase Dashboard → Edge Functions → Cron:
// cron: */30 * * * *
// function: send-reminders

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://belaorsinebeauty.com.br";

Deno.serve(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date().toISOString();

    // Find pending reminder notifications that are due
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select(
        "id, type, appointment_id, appointments(id, status, appointment_date, start_time, end_time, profiles(full_name, email), services(name), appointment_services(services(name)))"
      )
      .in("type", ["reminder_24h", "reminder_2h"])
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .limit(50);

    if (error) {
      console.error("Error fetching notifications:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
    }

    let sentCount = 0;

    for (const notif of notifications) {
      const apt = (notif as any).appointments;

      // Skip if appointment is cancelled
      if (!apt || apt.status === "cancelled" || apt.status === "no_show") {
        await supabase
          .from("notifications")
          .update({ status: "cancelled" })
          .eq("id", notif.id);
        continue;
      }

      if (!apt.profiles?.email) {
        await supabase
          .from("notifications")
          .update({ status: "failed" })
          .eq("id", notif.id);
        continue;
      }

      // Build service names
      const serviceNames: string[] = [];
      if (apt.appointment_services?.length > 0) {
        for (const as_ of apt.appointment_services) {
          if (as_.services?.name) serviceNames.push(as_.services.name);
        }
      } else if (apt.services?.name) {
        serviceNames.push(apt.services.name);
      }

      const clientName = apt.profiles.full_name || "Cliente";
      const servicesText = serviceNames.length > 0 ? serviceNames.join(", ") : "seus servicos";
      const isReminder24h = notif.type === "reminder_24h";
      const timeText = isReminder24h ? "amanha" : "em 2 horas";

      const formattedDate = new Date(`${apt.appointment_date}T12:00:00`).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const formattedTime = apt.start_time.substring(0, 5);

      if (RESEND_API_KEY) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Bela Orsine Beauty <noreply@belaorsinebeauty.com.br>",
              to: apt.profiles.email,
              subject: `Lembrete: ${servicesText} ${timeText}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e11d48;">
                    <h1 style="color: #e11d48; margin: 0;">Bela Orsine Beauty</h1>
                  </div>
                  <div style="padding: 30px 0;">
                    <h2 style="color: #333;">Lembrete de Agendamento</h2>
                    <p style="color: #666;">
                      Ola, <strong>${clientName}</strong>!
                      Seu agendamento e <strong>${timeText}</strong>.
                    </p>
                    <div style="background: #fdf2f8; border-radius: 8px; padding: 20px; margin: 20px 0;">
                      <p style="margin: 5px 0;"><strong>Servico(s):</strong> ${servicesText}</p>
                      <p style="margin: 5px 0;"><strong>Data:</strong> ${formattedDate}</p>
                      <p style="margin: 5px 0;"><strong>Horario:</strong> ${formattedTime}</p>
                    </div>
                    <p style="color: #666;">Estamos te esperando! Ate la!</p>
                    <div style="text-align: center; margin: 20px 0;">
                      <a href="${APP_URL}/cliente/meus-agendamentos"
                         style="background: #e11d48; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block;">
                        Ver meus agendamentos
                      </a>
                    </div>
                  </div>
                  <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
                    <p>Bela Orsine Beauty</p>
                  </div>
                </div>
              `,
            }),
          });

          if (emailRes.ok) {
            await supabase
              .from("notifications")
              .update({ status: "sent", sent_at: now })
              .eq("id", notif.id);
            sentCount++;
          } else {
            console.error("Resend error:", await emailRes.text());
            await supabase
              .from("notifications")
              .update({ status: "failed" })
              .eq("id", notif.id);
          }
        } catch (emailErr) {
          console.error("Email error:", emailErr);
          await supabase
            .from("notifications")
            .update({ status: "failed" })
            .eq("id", notif.id);
        }
      } else {
        console.log("RESEND_API_KEY not set, skipping");
        await supabase
          .from("notifications")
          .update({ status: "failed" })
          .eq("id", notif.id);
      }
    }

    return new Response(
      JSON.stringify({ sent: sentCount, total: notifications.length }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Reminder cron error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
