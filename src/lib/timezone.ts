/**
 * Modulo de Timezone — Bela Orsine Beauty
 *
 * Gerencia conversoes e calculos de data/hora para Adelaide, South Australia.
 * A aplicacao e focada em clientes de Adelaide (ACST UTC+9:30 / ACDT UTC+10:30).
 *
 * Nota: Adelaide observa Horario de Verao (DST) de outubro ate abril. O modulo
 * usa Intl.DateTimeFormat para determinar o offset correto automaticamente,
 * evitando bugs relacionados a DST.
 */

// ── Configuracao ───────────────────────────────────────────
const TIMEZONE = "Australia/Adelaide";

/**
 * Retorna a data de hoje (YYYY-MM-DD) em timezone de Adelaide.
 * Util para logs, queries e comparacoes de datas.
 */
export function getAdelaideDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Retorna um objeto Date que representa a hora/data atual em Adelaide.
 * Util para calcular diferencas de tempo (ex: "24h antes do agendamento").
 *
 * Nota: Este nao eh um Date UTC — eh representacao local de Adelaide.
 * Usar para comparacoes relativas de tempo, nao para armazenamento no BD (que deve ser UTC).
 */
export function getAdelaideNow(): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "0";
  return new Date(
    parseInt(get("year")),
    parseInt(get("month")) - 1,
    parseInt(get("day")),
    parseInt(get("hour")),
    parseInt(get("minute")),
    parseInt(get("second"))
  );
}

/**
 * Converte strings de data (YYYY-MM-DD) e hora (HH:MM ou HH:MM:SS)
 * em um objeto Date representando aquela hora local de Adelaide.
 *
 * Exemplo:
 *   adelaideDateTime("2025-03-01", "14:30") → Date de 14h30 em Adelaide
 */
export function adelaideDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const timeParts = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, timeParts[0], timeParts[1], timeParts[2] || 0);
}

/**
 * Retorna inicio e fim do dia em Adelaide no formato ISO (UTC).
 * Util para queries no banco que precisam filtrar "registros de hoje".
 *
 * Retorna:
 *   startOfDay:   00:00:00 Adelaide em ISO string
 *   startOfNextDay: 00:00:00 do proximo dia em ISO string
 *
 * Exemplo de uso:
 *   const { startOfDay, startOfNextDay } = getAdelaideDayRange()
 *   db.select().where(created_at >= startOfDay AND created_at < startOfNextDay)
 */
export function getAdelaideDayRange(): { startOfDay: string; startOfNextDay: string } {
  const todayStr = getAdelaideDateString();
  const [year, month, day] = todayStr.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - getAdelaideOffsetMs());
  const nextDay = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return {
    startOfDay: start.toISOString(),
    startOfNextDay: nextDay.toISOString(),
  };
}

/**
 * Calcula o offset UTC de Adelaide em milissegundos.
 * Usa Intl.DateTimeFormat para determinar o offset correto, tratando DST automaticamente.
 *
 * Retorna um numero negativo (Adelaide esta adiantada em relacao a UTC).
 * Exemplo: durante ACDT (horario de verao), retorna -37800000 ms (UTC-10:30)
 */
function getAdelaideOffsetMs(): number {
  const now = new Date();
  const utcStr = now.toLocaleString("en-US", { timeZone: "UTC" });
  const adelaideStr = now.toLocaleString("en-US", { timeZone: TIMEZONE });
  return new Date(adelaideStr).getTime() - new Date(utcStr).getTime();
}

export { TIMEZONE };
