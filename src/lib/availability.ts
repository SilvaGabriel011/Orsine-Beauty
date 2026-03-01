import { createClient } from "@/lib/supabase/server";

export interface TimeSlot {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

export type UnavailableReason =
  | "closed"        // Day not in working hours
  | "day_blocked"   // Entire day is blocked
  | "fully_booked"  // All slots taken
  | "past_date"     // Date is in the past
  | null;           // Slots available

export interface AvailabilityResult {
  slots: TimeSlot[];
  unavailableReason: UnavailableReason;
}

/**
 * Calculate available time slots for a given date and service duration.
 * Returns slots along with a reason if no slots are available.
 */
export async function getAvailableSlots(
  date: string, // "YYYY-MM-DD"
  durationMinutes: number
): Promise<TimeSlot[]> {
  const result = await getAvailableSlotsWithReason(date, durationMinutes);
  return result.slots;
}

/**
 * Extended version that also returns the reason if no slots are available.
 */
export async function getAvailableSlotsWithReason(
  date: string, // "YYYY-MM-DD"
  durationMinutes: number
): Promise<AvailabilityResult> {
  // Validate inputs
  if (durationMinutes <= 0 || durationMinutes > 1440) {
    return { slots: [], unavailableReason: null };
  }

  // Check if date is in the past
  const today = new Date().toISOString().split("T")[0];
  if (date < today) {
    return { slots: [], unavailableReason: "past_date" };
  }

  const supabase = await createClient();

  // Get day of week (0=Sunday, 6=Saturday)
  const dayOfWeek = new Date(date + "T12:00:00").getDay();

  // 1. Get working hours for this day
  const { data: workingHour } = (await supabase
    .from("working_hours")
    .select("*")
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .single()) as unknown as { data: { start_time: string; end_time: string } | null };

  if (!workingHour) {
    return { slots: [], unavailableReason: "closed" };
  }

  // 2. Get existing appointments for this date (not cancelled)
  const { data: appointments } = (await supabase
    .from("appointments")
    .select("start_time, end_time")
    .eq("appointment_date", date)
    .neq("status", "cancelled")) as unknown as { data: { start_time: string; end_time: string }[] | null };

  // 3. Get blocked slots for this date
  const { data: blockedSlots } = (await supabase
    .from("blocked_slots")
    .select("start_time, end_time")
    .eq("block_date", date)) as unknown as { data: { start_time: string | null; end_time: string | null }[] | null };

  // Check if entire day is blocked (start_time and end_time are null)
  const dayBlocked = (blockedSlots || []).some(
    (b) => !b.start_time && !b.end_time
  );
  if (dayBlocked) {
    return { slots: [], unavailableReason: "day_blocked" };
  }

  // 4. Generate all possible slots
  const allSlots = generateTimeSlots(
    workingHour.start_time,
    workingHour.end_time,
    durationMinutes
  );

  // 5. Filter out occupied and blocked slots
  const occupiedRanges = [
    ...(appointments || []).map((a) => ({
      start: a.start_time,
      end: a.end_time,
    })),
    ...(blockedSlots || [])
      .filter((b) => b.start_time && b.end_time)
      .map((b) => ({ start: b.start_time!, end: b.end_time! })),
  ];

  const availableSlots = allSlots.filter((slot) => {
    return !occupiedRanges.some(
      (occupied) =>
        timeToMinutes(slot.start) < timeToMinutes(occupied.end) &&
        timeToMinutes(slot.end) > timeToMinutes(occupied.start)
    );
  });

  if (availableSlots.length === 0 && allSlots.length > 0) {
    return { slots: [], unavailableReason: "fully_booked" };
  }

  return { slots: availableSlots, unavailableReason: null };
}

function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  while (current + durationMinutes <= end) {
    slots.push({
      start: minutesToTime(current),
      end: minutesToTime(current + durationMinutes),
    });
    current += durationMinutes;
  }

  return slots;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
