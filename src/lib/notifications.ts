/**
 * Modulo de Notificacoes — Bela Orsine Beauty
 *
 * Constroe e envia emails para clientes sobre agendamentos.
 * Usa Resend API (https://resend.com) como provedor de email.
 *
 * Templates:
 * - Confirmacao de agendamento
 * - Cancelamento de agendamento
 * - Lembretes (24h antes e 2h antes)
 *
 * Validacoes:
 * - Email do cliente valido
 * - API key do Resend configurada
 * - HTML escapeado para evitar XSS
 */

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sanitiza string para inclusao segura em templates HTML.
 * Escapa caracteres especiais HTML para evitar XSS.
 *
 * Exemplo:
 * - Input: "Nome & <script>"
 * - Output: "Nome &amp; &lt;script&gt;"
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Envia um email via Resend API.
 * Falhas sao logadas mas nao lancam erro (graceful degradation).
 *
 * @param data EmailData com to, subject, html
 * @returns true se enviado com sucesso, false caso contrario
 */
export async function sendEmail(data: EmailData): Promise<boolean> {
  try {
    // ── Valida se Resend esta configurado ──────────────────
    if (!process.env.RESEND_API_KEY) {
      console.log("Resend nao configurado, pulando email...");
      return false;
    }

    // ── Valida formato do email do destinatario ────────────
    if (!data.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.to)) {
      console.error("Email invalido:", data.to);
      return false;
    }

    // ── Envia via Resend API ────────────────────────────────
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
      console.error("Falha ao enviar email:", res.status, errorBody);
    }

    return res.ok;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
}

export interface ServiceItem {
  name: string;          // Nome do servico (ex: "Depilacao Laser")
  price: number;         // Preco em reais
  duration_minutes: number; // Duracao em minutos
}

/**
 * Formata um numero como moeda BRL (Real Brasileiro).
 * Exemplo: 100 → "R$ 100,00"
 */
function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Constroe lista HTML de servicos para templates de email.
 * Se apenas 1 servico, mostra de forma simples.
 * Se multiplos, usa lista com total.
 */
function buildServicesList(services: ServiceItem[]): string {
  // ── Um servico: formato simples ────────────────────────────
  if (services.length === 1) {
    return `<p style="margin: 5px 0;"><strong>Servico:</strong> ${escapeHtml(services[0].name)}</p>
            <p style="margin: 5px 0;"><strong>Valor:</strong> ${formatCurrency(services[0].price)}</p>
            <p style="margin: 5px 0;"><strong>Duracao:</strong> ${services[0].duration_minutes} min</p>`;
  }

  // ── Multiplos servicos: lista com totais ───────────────────
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

/**
 * Constroe email de confirmacao de agendamento.
 * Inclui detalhes do servico, data/hora e link para meus agendamentos.
 */
export function buildConfirmationEmail(params: {
  clientName: string;    // Nome do cliente (para saudacao)
  services: ServiceItem[]; // Servicos agendados
  date: string;          // Data formatada (ex: "1 de marco de 2025")
  time: string;          // Hora formatada (ex: "14:30")
  appointmentId: string; // UUID do agendamento (para registros)
  cancelToken?: string;  // Token para cancelamento (opcional)
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

          ${params.cancelToken ? `
          <p style="color: #666; text-align: center; margin: 20px 0;">ou</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${appUrl}/cancelar?id=${params.appointmentId}&token=${params.cancelToken}"
               style="background: #dc2626; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block;">
              Cancelar Agendamento
            </a>
          </div>
          ` : ''}

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

/**
 * Constroe email de cancelamento de agendamento.
 * Confirma cancelamento e oferece link para reagendar.
 */
export function buildCancellationEmail(params: {
  clientName: string;    // Nome do cliente
  services: ServiceItem[]; // Servicos que foram cancelados
  date: string;          // Data do agendamento cancelado
  time: string;          // Hora do agendamento cancelado
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

/**
 * Constroe email de lembrete de agendamento.
 * Enviado 24h antes ou 2h antes do agendamento.
 *
 * @param params.type "24h" para lembrete do dia anterior, "2h" para 2h antes
 */
export function buildReminderEmail(params: {
  clientName: string;  // Nome do cliente
  serviceNames: string; // Nomes dos servicos (comma-separated)
  date: string;        // Data formatada
  time: string;        // Hora formatada
  type: "24h" | "2h";  // Tipo de lembrete
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

/**
 * Constroe email de reagendamento de agendamento.
 * Mostra dados antigos e novos do agendamento.
 */
export function buildRescheduleEmail(params: {
  clientName: string;    // Nome do cliente
  services: ServiceItem[]; // Servicos agendados
  oldDate: string;       // Data anterior
  oldTime: string;       // Hora anterior
  newDate: string;       // Nova data
  newTime: string;       // Nova hora
}): EmailData {
  const serviceNames = params.services.map((s) => s.name).join(", ");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    to: "",
    subject: `Agendamento Reagendado - ${serviceNames}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e11d48;">
          <h1 style="color: #e11d48; margin: 0;">Bela Orsine Beauty</h1>
        </div>

        <div style="padding: 30px 0;">
          <h2 style="color: #333;">Agendamento Reagendado</h2>
          <p style="color: #666;">Ola, <strong>${escapeHtml(params.clientName)}</strong>!</p>
          <p style="color: #666;">Seu agendamento foi reagendado com sucesso.</p>

          <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #dc2626;"><strong>Antigo Horario:</strong></p>
            <p style="margin: 5px 0;">${escapeHtml(params.oldDate)} as ${escapeHtml(params.oldTime)}</p>
          </div>

          <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #16a34a;"><strong>Novo Horario:</strong></p>
            <p style="margin: 5px 0;">${escapeHtml(params.newDate)} as ${escapeHtml(params.newTime)}</p>
            ${buildServicesList(params.services)}
          </div>

          <p style="color: #666;">
            Caso precise fazer alteracoes, acesse sua area do cliente:
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${appUrl}/cliente/meus-agendamentos"
               style="background: #e11d48; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block;">
              Meus Agendamentos
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

/**
 * Constroe email de cancelamento para o admin.
 * Notifica sobre cancelamento de agendamento com dados do cliente.
 */
export function buildAdminCancellationEmail(params: {
  clientName: string;    // Nome do cliente
  clientEmail: string;  // Email do cliente
  clientPhone?: string; // Telefone do cliente (opcional)
  services: ServiceItem[]; // Servicos cancelados
  date: string;          // Data do agendamento
  time: string;          // Hora do agendamento
}): EmailData {
  const serviceNames = params.services.map((s) => s.name).join(", ");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    to: "",
    subject: `CANCELAMENTO - ${serviceNames}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #dc2626;">
          <h1 style="color: #dc2626; margin: 0;">CANCELAMENTO DE AGENDAMENTO</h1>
        </div>

        <div style="padding: 30px 0;">
          <h2 style="color: #333;">Cliente cancelou agendamento</h2>
          
          <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Cliente:</strong> ${escapeHtml(params.clientName)}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${escapeHtml(params.clientEmail)}</p>
            ${params.clientPhone ? `<p style="margin: 5px 0;"><strong>Telefone:</strong> ${escapeHtml(params.clientPhone)}</p>` : ''}
            <hr style="margin: 15px 0; border: none; border-top: 1px solid #fecaca;">
            <p style="margin: 5px 0;"><strong>Serviço(s):</strong> ${escapeHtml(serviceNames)}</p>
            <p style="margin: 5px 0;"><strong>Data:</strong> ${escapeHtml(params.date)}</p>
            <p style="margin: 5px 0;"><strong>Horário:</strong> ${escapeHtml(params.time)}</p>
          </div>

          <p style="color: #666;">
            Horário liberado para novos agendamentos.
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${appUrl}/admin/agendamentos"
               style="background: #dc2626; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block;">
              Ver Agendamentos
            </a>
          </div>
        </div>

        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>Bela Orsine Beauty - Sistema de Agendamentos</p>
        </div>
      </div>
    `,
  };
}
