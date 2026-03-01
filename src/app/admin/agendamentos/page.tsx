export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { AppointmentsClient } from "./appointments-client";

export const metadata = { title: "Agendamentos" };

export default async function AgendamentosPage() {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  const { data: appointments } = (await supabase
    .from("appointments")
    .select(
      "*, services(id, name, price, duration_minutes, categories(id, name)), profiles(id, full_name, phone, email)"
    )
    .gte("appointment_date", today)
    .order("appointment_date")
    .order("start_time")) as unknown as { data: any[] | null };

  return <AppointmentsClient initialAppointments={appointments || []} />;
}
