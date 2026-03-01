// Supabase Edge Function: feedback-cron
// Sends feedback request emails 1 hour after completed appointments.
// Schedule: runs every 15 minutes via Supabase cron.
//
// Setup in Supabase Dashboard → Edge Functions → Cron:
// cron: */15 * * * *
// function: feedback-cron

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://belaorsinebeauty.com.br";

Deno.serve(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find pending feedback_request notifications that are due
    const now = new Date().toISOString();

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select(
        "id, appointment_id, appointments(id, client_id, appointment_date, start_time, profiles(full_name, email), services(name), appointment_services(services(name)))"
      )
      .eq("type", "feedback_request")
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
      if (!apt || !apt.profiles?.email) {
        // Mark as failed
        await supabase
          .from("notifications")
          .update({ status: "failed" })
          .eq("id", notif.id);
        continue;
      }

      // Check if review already exists for this appointment
      const { count: reviewCount } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("appointment_id", apt.id);

      if (reviewCount && reviewCount > 0) {
        // Already reviewed, mark as sent (skip)
        await supabase
          .from("notifications")
          .update({ status: "sent", sent_at: now })
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
      const servicesText =
        serviceNames.length > 0 ? serviceNames.join(", ") : "seus servicos";
      const reviewUrl = `${APP_URL}/cliente/avaliar/${apt.id}`;

      // Send email
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
              subject: `Como foi sua experiencia? Avalie - ${servicesText}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e11d48;">
                    <h1 style="color: #e11d48; margin: 0;">Bela Orsine Beauty</h1>
                  </div>
                  <div style="padding: 30px 0;">
                    <h2 style="color: #333;">Como foi sua experiencia?</h2>
                    <p style="color: #666;">Ola, <strong>${clientName}</strong>!</p>
                    <p style="color: #666;">
                      Esperamos que voce tenha gostado do(s) servico(s): <strong>${servicesText}</strong>.
                    </p>
                    <p style="color: #666;">
                      Sua avaliacao nos ajuda a melhorar cada vez mais. Leva menos de 1 minuto!
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${reviewUrl}"
                         style="background: #e11d48; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold;">
                        Avaliar Atendimento
                      </a>
                    </div>
                    <p style="color: #999; font-size: 12px; text-align: center;">
                      Se voce ja avaliou, por favor desconsidere este email.
                    </p>
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
          console.error("Email send error:", emailErr);
          await supabase
            .from("notifications")
            .update({ status: "failed" })
            .eq("id", notif.id);
        }
      } else {
        console.log("RESEND_API_KEY not set, skipping email");
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
    console.error("Feedback cron error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
