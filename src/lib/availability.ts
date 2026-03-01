/**
 * Modulo de Disponibilidade — Bela Orsine Beauty
 *
 * Calcula horarios disponiveis para agendamento de servicos.
 * Considera:
 * - Horario de funcionamento do dia da semana
 * - Agendamentos ja feitos (conflicts de horario)
 * - Bloqueios manuais (manutencao, ausenias)
 * - Data no passado (validacao)
 *
 * Algoritmo:
 * 1. Gera todos os slots possiveis no dia (ex: 09:00, 09:30, 10:00, ...)
 * 2. Remove slots que conflitam com agendamentos existentes
 * 3. Remove slots que conflitam com bloqueios
 * 4. Retorna slots disponiveis ou motivo da indisponibilidade
 */

import { createClient } from "@/lib/supabase/server";

export interface TimeSlot {
  start: string; // "HH:mm" formato 24h
  end: string;   // "HH:mm" formato 24h
}

export type UnavailableReason =
  | "closed"        // Dia nao faz parte do horario de funcionamento
  | "day_blocked"   // Dia inteiro esta bloqueado (manutencao, ausencia)
  | "fully_booked"  // Todos os slots estao ocupados
  | "past_date"     // Data e no passado
  | null;           // Slots disponiveis

export interface AvailabilityResult {
  slots: TimeSlot[];
  unavailableReason: UnavailableReason;
}

/**
 * Calcula horarios disponiveis para agendamento em uma data especifica.
 * Retorna slots e motivo se nenhum estiver disponivel.
 *
 * @param date Data no formato "YYYY-MM-DD"
 * @param durationMinutes Duracao do servico em minutos (ex: 60 para 1h)
 */
export async function getAvailableSlots(
  date: string,
  durationMinutes: number
): Promise<TimeSlot[]> {
  const result = await getAvailableSlotsWithReason(date, durationMinutes);
  return result.slots;
}

/**
 * Versao estendida que retorna tambem o motivo da indisponibilidade.
 * Util para exibir mensagens customizadas ao usuario (ex: "Dia bloqueado").
 *
 * @param date Data no formato "YYYY-MM-DD"
 * @param durationMinutes Duracao do servico em minutos
 */
export async function getAvailableSlotsWithReason(
  date: string,
  durationMinutes: number
): Promise<AvailabilityResult> {
  // ── Valida entrada ────────────────────────────────────────
  if (durationMinutes <= 0 || durationMinutes > 1440) {
    return { slots: [], unavailableReason: null };
  }

  // ── Verifica se data esta no passado ──────────────────────
  const today = new Date().toISOString().split("T")[0];
  if (date < today) {
    return { slots: [], unavailableReason: "past_date" };
  }

  const supabase = await createClient();

  // ── Determina dia da semana (0=domingo, 6=sabado) ─────────
  const dayOfWeek = new Date(date + "T12:00:00").getDay();

  // ── 1. Busca horario de funcionamento do dia ──────────────
  const { data: workingHour } = (await supabase
    .from("working_hours")
    .select("*")
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .single()) as unknown as { data: { start_time: string; end_time: string } | null };

  if (!workingHour) {
    return { slots: [], unavailableReason: "closed" };
  }

  // ── 2. Busca agendamentos ja feitos nesta data (nao cancelados) ──
  const { data: appointments } = (await supabase
    .from("appointments")
    .select("start_time, end_time")
    .eq("appointment_date", date)
    .neq("status", "cancelled")) as unknown as { data: { start_time: string; end_time: string }[] | null };

  // ── 3. Busca bloqueios manuais nesta data ────────────────
  const { data: blockedSlots } = (await supabase
    .from("blocked_slots")
    .select("start_time, end_time")
    .eq("block_date", date)) as unknown as { data: { start_time: string | null; end_time: string | null }[] | null };

  // ── Valida se dia inteiro esta bloqueado ─────────────────
  // Um bloqueio com start_time e end_time nulos significa dia inteiro bloqueado
  const dayBlocked = (blockedSlots || []).some(
    (b) => !b.start_time && !b.end_time
  );
  if (dayBlocked) {
    return { slots: [], unavailableReason: "day_blocked" };
  }

  // ── 4. Gera todos os slots possiveis ──────────────────────
  // Ex: duracao de 60 min em horario 09:00-12:00 → [09:00-10:00, 10:00-11:00, 11:00-12:00]
  const allSlots = generateTimeSlots(
    workingHour.start_time,
    workingHour.end_time,
    durationMinutes
  );

  // ── 5. Filtra slots ocupados e bloqueados ────────────────
  // Combina agendamentos e bloqueios em um array de ranges ocupadas
  const occupiedRanges = [
    ...(appointments || []).map((a) => ({
      start: a.start_time,
      end: a.end_time,
    })),
    ...(blockedSlots || [])
      .filter((b) => b.start_time && b.end_time)
      .map((b) => ({ start: b.start_time!, end: b.end_time! })),
  ];

  // Verifica se cada slot disponivel conflita com alguma range ocupada
  const availableSlots = allSlots.filter((slot) => {
    return !occupiedRanges.some(
      (occupied) =>
        // Conflict: slot comeca antes do fim da ocupacao E termina depois do inicio
        timeToMinutes(slot.start) < timeToMinutes(occupied.end) &&
        timeToMinutes(slot.end) > timeToMinutes(occupied.start)
    );
  });

  // ── Determina motivo se nenhum slot disponivel ────────────
  if (availableSlots.length === 0 && allSlots.length > 0) {
    return { slots: [], unavailableReason: "fully_booked" };
  }

  return { slots: availableSlots, unavailableReason: null };
}

/**
 * Gera todos os slots possiveis em um periodo, com intervalo especificado.
 *
 * Exemplo:
 * - startTime: "09:00", endTime: "12:00", duration: 60
 * - Retorna: [{ start: "09:00", end: "10:00" }, { start: "10:00", end: "11:00" }, ...]
 *
 * Nota: Um slot so e incluido se cabe inteiramente antes do fim do horario.
 * Se termina exatamente no horario de fechamento, eh incluido.
 */
function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  // Itera enquanto houver espaco para um slot completo
  while (current + durationMinutes <= end) {
    slots.push({
      start: minutesToTime(current),
      end: minutesToTime(current + durationMinutes),
    });
    current += durationMinutes;
  }

  return slots;
}

/**
 * Converte "HH:mm" para numero de minutos desde meia-noite.
 * Exemplo: "14:30" → 870 (14*60 + 30)
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Converte numero de minutos desde meia-noite para "HH:mm".
 * Exemplo: 870 → "14:30"
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
