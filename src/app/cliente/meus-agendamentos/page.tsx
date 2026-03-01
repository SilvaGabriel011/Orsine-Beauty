export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AgendamentosClient from "./agendamentos-client";

export const metadata: Metadata = { title: "Meus Agendamentos" };

export default async function MeusAgendamentosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Fetch appointments with services + appointment_services (multi-service)
  const { data: appointments } = (await (supabase
    .from("appointments") as any)
    .select(
      "id, status, appointment_date, start_time, end_time, amount_paid, service_id, services(id, name, price, duration_minutes, categories(id, name)), appointment_services(service_id, services(id, name, price, duration_minutes, categories(id, name)))"
    )
    .eq("client_id", user.id)
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: false })) as { data: any[] | null };

  // For each appointment, check if user already submitted a review
  const appointmentIds = (appointments || []).map((a: any) => a.id);

  let reviewsMap: Record<string, { id: string; rating: number }> = {};

  if (appointmentIds.length > 0) {
    const { data: reviews } = (await (supabase.from("reviews") as any)
      .select("id, rating, appointment_id")
      .eq("client_id", user.id)
      .in("appointment_id", appointmentIds)) as { data: any[] | null };

    if (reviews) {
      for (const r of reviews) {
        reviewsMap[r.appointment_id] = { id: r.id, rating: r.rating };
      }
    }
  }

  // Attach review info to each appointment
  const enriched = (appointments || []).map((apt: any) => ({
    ...apt,
    review: reviewsMap[apt.id] || null,
  }));

  return <AgendamentosClient appointments={enriched} />;
}
