/**
 * Modulo de Integracao Google Calendar — Bela Orsine Beauty
 *
 * Sincroniza agendamentos com Google Calendar do negocio.
 * Permite que clientes vejam disponibilidade em tempo real.
 *
 * Fluxo:
 * 1. Obtem access token via refresh token (OAuth 2.0)
 * 2. Cria/atualiza/deleta eventos no calendario
 * 3. Cache de token em memoria com TTL de 55 minutos (refresh a cada 1h)
 *
 * Credenciais necessarias (env vars):
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_REFRESH_TOKEN
 * - GOOGLE_CALENDAR_ID (default: "primary")
 */

import { withRetry } from "./retry";

interface CalendarEvent {
  summary: string;     // Titulo do evento (ex: "Depilacao Laser")
  description: string; // Descricao (ex: "Cliente: Maria Silva")
  startDateTime: string; // ISO 8601 (ex: "2025-03-01T14:30:00")
  endDateTime: string;   // ISO 8601 (ex: "2025-03-01T15:30:00")
}

// ── Cache de token em memoria ──────────────────────────────
// Serverless: ok usar variavel global pois requisicoes dao reutilizacoes do container
// TTL: 55 minutos (Google retorna 60 minutos, buffer de 5 min para seguranca)
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Obtem access token para API do Google Calendar.
 * Usa refresh token para conseguir novo access token.
 * Cache em memoria com TTL de 55 minutos.
 *
 * OAuth 2.0 Flow:
 * - Envia refresh_token para Google
 * - Recebe novo access_token com expiracao
 * - Cacheia ate proximo vencimento
 */
async function getAccessToken(): Promise<string> {
  // ── Retorna token cacheado se ainda valido ─────────────────
  // Buffer de 5 min para evitar usar token que expira em seguida
  if (cachedToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  // ── Carrega credenciais do ambiente ────────────────────────
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google Calendar nao configurado: faltam credenciais em .env.local");
  }

  // ── Requisita novo access token ────────────────────────────
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();

  if (!data.access_token) {
    throw new Error("Falha ao renovar token do Google");
  }

  // ── Cacheia novo token com seu tempo de expiracao ─────────
  // Google retorna expires_in em segundos (default 3600s = 1h)
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;

  return cachedToken;
}

/**
 * Cria um evento no Google Calendar.
 * Usado quando um novo agendamento eh feito.
 *
 * Faz retry automaticamente em caso de erro temporario.
 * Invalida token cacheado se recebe 401 (unauthorized).
 *
 * @param event Evento com summary, description, start/end times
 * @returns ID do evento criado, ou null se falhar
 */
export async function createCalendarEvent(
  event: CalendarEvent
): Promise<string | null> {
  try {
    // ── Valida se Google Calendar esta configurado ──────────
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      console.log("Google Calendar nao configurado, pulando...");
      return null;
    }

    // ── Executa com retry em caso de erro temporario ────────
    return await withRetry(
      async () => {
        // Obtem token de acesso (cacheado ou novo)
        const accessToken = await getAccessToken();
        const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

        // Chama Google Calendar API para criar evento
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              summary: event.summary,
              description: event.description,
              start: {
                dateTime: event.startDateTime,
                timeZone: "America/Sao_Paulo",
              },
              end: {
                dateTime: event.endDateTime,
                timeZone: "America/Sao_Paulo",
              },
              reminders: { useDefault: false },
            }),
          }
        );

        if (!res.ok) {
          // ── Invalida cache se nao autorizado ───────────────
          // Pode ser que refresh token expirou (requer reauth manual)
          if (res.status === 401) {
            cachedToken = null;
            tokenExpiresAt = 0;
          }
          throw Object.assign(new Error(`Calendar API error: ${res.status}`), { status: res.status });
        }

        // ── Extrai ID do evento criado ──────────────────────
        const data = await res.json();
        return data.id || null;
      },
      {
        maxAttempts: 2,
        initialDelayMs: 500,
        onRetry: (err, attempt) =>
          console.warn(`Calendar API retry #${attempt}:`, err),
      }
    );
  } catch (error) {
    console.error("Erro ao criar evento no calendario:", error);
    return null;
  }
}

/**
 * Deleta um evento do Google Calendar.
 * Usado quando um agendamento eh cancelado.
 *
 * @param eventId ID do evento no Google Calendar
 * @returns true se deletado com sucesso, false caso contrario
 */
export async function deleteCalendarEvent(
  eventId: string
): Promise<boolean> {
  try {
    // ── Valida configuracao ────────────────────────────────
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      return false;
    }

    // ── Obtem token e calendar ID ──────────────────────────
    const accessToken = await getAccessToken();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    // ── Deleta evento via API ──────────────────────────────
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return res.ok;
  } catch (error) {
    console.error("Erro ao deletar evento do calendario:", error);
    return false;
  }
}

/**
 * Atualiza um evento do Google Calendar.
 * Usado quando um agendamento eh remarcado ou alterado.
 *
 * @param eventId ID do evento no Google Calendar
 * @param event Dados atualizados do evento
 * @returns true se atualizado com sucesso, false caso contrario
 */
export async function updateCalendarEvent(
  eventId: string,
  event: CalendarEvent
): Promise<boolean> {
  try {
    // ── Valida configuracao ────────────────────────────────
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      return false;
    }

    // ── Obtem token e calendar ID ──────────────────────────
    const accessToken = await getAccessToken();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    // ── Atualiza evento via API (PUT substitui inteiro) ────
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: event.summary,
          description: event.description,
          start: {
            dateTime: event.startDateTime,
            timeZone: "America/Sao_Paulo",
          },
          end: {
            dateTime: event.endDateTime,
            timeZone: "America/Sao_Paulo",
          },
          reminders: { useDefault: false },
        }),
      }
    );

    return res.ok;
  } catch (error) {
    console.error("Erro ao atualizar evento do calendario:", error);
    return false;
  }
}
