/**
 * Modulo de SMS — Bela Orsine Beauty
 *
 * Envia mensagens SMS para clientes via Twilio.
 * Usado para: confirmacao de agendamento, lembretes (24h/2h),
 * cancelamento e solicitacao de feedback.
 *
 * Provedor: Twilio (padrao na Australia)
 * Docs: https://www.twilio.com/docs/sms
 *
 * Variaveis de ambiente necessarias:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER (ex: +61400000000 ou numero Twilio)
 */

interface SmsData {
  to: string;
  message: string;
}

/**
 * Normaliza numero de telefone para formato internacional.
 * Assume Australia (+61) se nao houver codigo de pais.
 */
function normalizePhone(phone: string): string {
  // Remove espacos, hifens, parenteses
  const clean = phone.replace(/[\s\-\(\)]/g, "");

  // Ja tem codigo de pais
  if (clean.startsWith("+")) return clean;

  // Australia: numero comeca com 0 → troca por +61
  if (clean.startsWith("0")) return `+61${clean.slice(1)}`;

  // Assume Australia se nao tiver codigo
  return `+61${clean}`;
}

/**
 * Envia SMS via Twilio REST API.
 * Falhas sao logadas mas nao lancam erro (graceful degradation).
 *
 * @param data SmsData com to (telefone) e message (texto)
 * @returns true se enviado, false caso contrario
 */
export async function sendSms(data: SmsData): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  // Graceful degradation: se nao configurado, apenas loga
  if (!accountSid || !authToken || !fromNumber) {
    console.log("[SMS] Twilio nao configurado — SMS nao enviado:", data.message.slice(0, 50));
    return false;
  }

  if (!data.to) {
    console.warn("[SMS] Numero de telefone ausente");
    return false;
  }

  const toNumber = normalizePhone(data.to);

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: toNumber,
        Body: data.message,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("[SMS] Twilio error:", err);
      return false;
    }

    console.log(`[SMS] Enviado para ${toNumber}`);
    return true;
  } catch (error) {
    console.error("[SMS] Erro ao enviar via Twilio:", error);
    return false;
  }
}

// ── Templates de mensagem ──────────────────────────────────────────────────

const STUDIO_NAME = "Bela Orsine Beauty";

/**
 * SMS de confirmacao de agendamento
 */
export function buildConfirmationSms(params: {
  clientName: string;
  serviceName: string;
  date: string; // "Monday, 10 March"
  time: string; // "2:00 PM"
  phone: string;
}): SmsData {
  return {
    to: params.phone,
    message: `Hi ${params.clientName}! Your appointment at ${STUDIO_NAME} is confirmed ✨\n📅 ${params.date} at ${params.time}\n💅 ${params.serviceName}\nSee you soon! To cancel/reschedule, call us or visit your booking page.`,
  };
}

/**
 * SMS lembrete 24h antes
 */
export function buildReminder24hSms(params: {
  clientName: string;
  serviceName: string;
  time: string; // "2:00 PM"
  phone: string;
}): SmsData {
  return {
    to: params.phone,
    message: `Hi ${params.clientName}! Reminder: you have an appointment at ${STUDIO_NAME} tomorrow at ${params.time} for ${params.serviceName}. See you then! 💅`,
  };
}

/**
 * SMS lembrete 2h antes
 */
export function buildReminder2hSms(params: {
  clientName: string;
  serviceName: string;
  time: string;
  phone: string;
}): SmsData {
  return {
    to: params.phone,
    message: `Hi ${params.clientName}! Just a quick reminder — your ${params.serviceName} appointment at ${STUDIO_NAME} is in 2 hours (${params.time}). We're looking forward to seeing you! 🌸`,
  };
}

/**
 * SMS de cancelamento
 */
export function buildCancellationSms(params: {
  clientName: string;
  serviceName: string;
  date: string;
  phone: string;
  bookingUrl: string;
}): SmsData {
  return {
    to: params.phone,
    message: `Hi ${params.clientName}, your ${params.serviceName} appointment on ${params.date} at ${STUDIO_NAME} has been cancelled. Book again anytime: ${params.bookingUrl}`,
  };
}

/**
 * SMS de solicitacao de feedback (1h apos atendimento)
 */
export function buildFeedbackSms(params: {
  clientName: string;
  serviceName: string;
  reviewUrl: string;
  phone: string;
}): SmsData {
  return {
    to: params.phone,
    message: `Hi ${params.clientName}! How was your ${params.serviceName} at ${STUDIO_NAME}? We'd love your feedback 🌟 ${params.reviewUrl}`,
  };
}
