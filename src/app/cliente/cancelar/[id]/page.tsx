import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CancelarClient from "./cancelar-client";

export default async function CancelarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirect=/cliente/cancelar/${id}`);
  }

  const { data: appointment } = await (supabase
    .from("appointments") as any)
    .select(
      "id, status, appointment_date, start_time, end_time, amount_paid, client_id, services(id, name, price, duration_minutes, categories(name)), appointment_services(services(id, name, price, duration_minutes, categories(name))), profiles(full_name, email)"
    )
    .eq("id", id)
    .single();

  if (!appointment || appointment.client_id !== user.id) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h1 className="mb-2 text-2xl font-bold">Agendamento nao encontrado</h1>
        <p className="text-muted-foreground">
          Este agendamento nao existe ou nao pertence a voce.
        </p>
      </div>
    );
  }

  return <CancelarClient appointment={appointment} />;
}
