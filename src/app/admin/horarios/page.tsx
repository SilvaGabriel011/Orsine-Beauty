export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { HorariosClient } from "./horarios-client";
import type { WorkingHour, BlockedSlot } from "@/types/database";

export const metadata = { title: "Horarios" };

export default async function HorariosPage() {
  const supabase = await createClient();

  const { data: workingHours } = (await supabase
    .from("working_hours")
    .select("*")
    .order("day_of_week")) as unknown as { data: WorkingHour[] | null };

  const { data: blockedSlots } = (await supabase
    .from("blocked_slots")
    .select("*")
    .order("block_date")) as unknown as { data: BlockedSlot[] | null };

  return (
    <HorariosClient
      initialHours={workingHours || []}
      initialBlocked={blockedSlots || []}
    />
  );
}
