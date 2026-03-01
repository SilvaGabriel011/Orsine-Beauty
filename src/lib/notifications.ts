interface EmailData {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sanitize a string for safe inclusion in HTML email templates.
 * Prevents XSS by escaping HTML special characters.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendEmail(data: EmailData): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log("Resend not configured, skipping email...");
      return false;
    }

    // Validate email format
    if (!data.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.to)) {
      console.error("Invalid email address:", data.to);
      return false;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Bela Orsine Beauty <noreply@belaorsinebeauty.com.br>",
        to: data.to,
        subject: data.subject,
        html: data.html,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "unknown");
      console.error("Email send failed:", res.status, errorBody);
    }

    return res.ok;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export interface ServiceItem {
  name: string;
  price: number;
  duration_minutes: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function buildServicesList(services: ServiceItem[]): string {
  if (services.length === 1) {
    return `<p style="margin: 5px 0;"><strong>Servico:</strong> ${escapeHtml(services[0].name)}</p>
            <p style="margin: 5px 0;"><strong>Valor:</strong> ${formatCurrency(services[0].price)}</p>
            <p style="margin: 5px 0;"><strong>Duracao:</strong> ${services[0].duration_minutes} min</p>`;
  }

  const items = services
    .map(
      (s) =>
        `<li style="margin: 4px 0;">${escapeHtml(s.name)} — ${formatCurrency(s.price)} (${s.duration_minutes} min)</li>`
    )
    .join("");

  const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = services.reduce(
    (sum, s) => sum + s.duration_minutes,
    0
  );

  return `<p style="margin: 5px 0;"><strong>Servicos:</strong></p>
          <ul style="margin: 5px 0; padding-left: 20px;">${items}</ul>
          <p style="margin: 5px 0;"><strong>Total:</strong> ${formatCurrency(totalPrice)} (${totalDuration} min)</p>`;
}

export function buildConfirmationEmail(params: {
  clientName: string;
  services: ServiceItem[];
  date: string;
  time: string;
  appointmentId: string;
}): EmailData {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const serviceNames = params.services.map((s) => s.name).join(", ");

  return {
    to: "", // will be set by caller
    subject: `Agendamento Confirmado - ${serviceNames}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e11d48;">
          <h1 style="color: #e11d48; margin: 0;">Bela Orsine Beauty</h1>
        </div>

        <div style="padding: 30px 0;">
          <h2 style="color: #333;">Agendamento Confirmado!</h2>
          <p style="color: #666;">Ola, <strong>${escapeHtml(params.clientName)}</strong>!</p>
          <p style="color: #666;">Seu agendamento foi confirmado com sucesso.</p>

          <div style="background: #fdf2f8; border-radius: 8px; padding: 20px; margin: 20px 0;">
            ${buildServicesList(params.services)}
            <p style="margin: 5px 0;"><strong>Data:</strong> ${escapeHtml(params.date)}</p>
            <p style="margin: 5px 0;"><strong>Horario:</strong> ${escapeHtml(params.time)}</p>
          </div>

          <p style="color: #666;">
            Caso precise cancelar ou reagendar, acesse sua area do cliente:
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${appUrl}/cliente/meus-agendamentos"
               style="background: #e11d48; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block;">
              Meus Agendamentos
            </a>
          </div>

          <p style="color: #999; font-size: 12px;">
            Cancelamentos devem ser feitos com pelo menos 24h de antecedencia.
          </p>
        </div>

        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>Bela Orsine Beauty</p>
        </div>
      </div>
    `,
  };
}

export function buildCancellationEmail(params: {
  clientName: string;
  services: ServiceItem[];
  date: string;
  time: string;
}): EmailData {
  const serviceNames = params.services.map((s) => s.name).join(", ");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    to: "",
    subject: `Agendamento Cancelado - ${serviceNames}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e11d48;">
          <h1 style="color: #e11d48; margin: 0;">Bela Orsine Beauty</h1>
        </div>

        <div style="padding: 30px 0;">
          <h2 style="color: #333;">Agendamento Cancelado</h2>
          <p style="color: #666;">Ola, <strong>${escapeHtml(params.clientName)}</strong>!</p>
          <p style="color: #666;">Seu agendamento foi cancelado.</p>

          <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Servico(s):</strong> ${escapeHtml(serviceNames)}</p>
            <p style="margin: 5px 0;"><strong>Data:</strong> ${escapeHtml(params.date)}</p>
            <p style="margin: 5px 0;"><strong>Horario:</strong> ${escapeHtml(params.time)}</p>
          </div>

          <p style="color: #666;">
            Deseja reagendar? Acesse nosso site:
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${appUrl}/agendar"
               style="background: #e11d48; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block;">
              Agendar Novamente
            </a>
          </div>
        </div>

        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>Bela Orsine Beauty</p>
        </div>
      </div>
    `,
  };
}

export function buildReminderEmail(params: {
  clientName: string;
  serviceNames: string;
  date: string;
  time: string;
  type: "24h" | "2h";
}): EmailData {
  const timeText = params.type === "24h" ? "amanha" : "em 2 horas";

  return {
    to: "",
    subject: `Lembrete: ${params.serviceNames} ${timeText}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e11d48;">
          <h1 style="color: #e11d48; margin: 0;">Bela Orsine Beauty</h1>
        </div>

        <div style="padding: 30px 0;">
          <h2 style="color: #333;">Lembrete de Agendamento</h2>
          <p style="color: #666;">
            Ola, <strong>${escapeHtml(params.clientName)}</strong>!
            Seu agendamento e <strong>${timeText}</strong>.
          </p>

          <div style="background: #fdf2f8; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Servico(s):</strong> ${escapeHtml(params.serviceNames)}</p>
            <p style="margin: 5px 0;"><strong>Data:</strong> ${escapeHtml(params.date)}</p>
            <p style="margin: 5px 0;"><strong>Horario:</strong> ${escapeHtml(params.time)}</p>
          </div>

          <p style="color: #666;">Estamos te esperando! Ate la!</p>
        </div>

        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>Bela Orsine Beauty</p>
        </div>
      </div>
    `,
  };
}
