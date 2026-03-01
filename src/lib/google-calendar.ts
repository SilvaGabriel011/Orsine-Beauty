import { withRetry } from "./retry";

interface CalendarEvent {
  summary: string;
  description: string;
  startDateTime: string; // ISO 8601
  endDateTime: string; // ISO 8601
}

// ── Token cache (in-memory, safe for serverless with short TTL) ──
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google Calendar credentials not configured");
  }

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
    throw new Error("Failed to refresh Google access token");
  }

  // Cache the token (default 1h expiry from Google)
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;

  return cachedToken;
}

export async function createCalendarEvent(
  event: CalendarEvent
): Promise<string | null> {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      console.log("Google Calendar not configured, skipping...");
      return null;
    }

    return await withRetry(
      async () => {
        const accessToken = await getAccessToken();
        const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

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
          // Invalidate cached token on auth error
          if (res.status === 401) {
            cachedToken = null;
            tokenExpiresAt = 0;
          }
          throw Object.assign(new Error(`Calendar API error: ${res.status}`), { status: res.status });
        }

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
    console.error("Error creating calendar event:", error);
    return null;
  }
}

export async function deleteCalendarEvent(
  eventId: string
): Promise<boolean> {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      return false;
    }

    const accessToken = await getAccessToken();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

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
    console.error("Error deleting calendar event:", error);
    return false;
  }
}

export async function updateCalendarEvent(
  eventId: string,
  event: CalendarEvent
): Promise<boolean> {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
      return false;
    }

    const accessToken = await getAccessToken();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

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
    console.error("Error updating calendar event:", error);
    return false;
  }
}
