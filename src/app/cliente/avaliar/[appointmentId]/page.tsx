export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import StarRating from "@/components/reviews/StarRating";
import ReviewFormClient from "./review-form-client";

export const metadata: Metadata = {
  title: "Avaliar Atendimento",
};

export default async function AvaliarPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch appointment with services
  const { data: appointment } = (await (supabase.from("appointments") as any)
    .select(
      "id, client_id, status, appointment_date, start_time, service_id, services(id, name), appointment_services(service_id, services(id, name))"
    )
    .eq("id", appointmentId)
    .single()) as { data: any | null };

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-semibold text-gray-900">
          Agendamento nao encontrado
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Este agendamento nao existe ou voce nao tem acesso.
        </p>
      </div>
    );
  }

  if (appointment.client_id !== user.id) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-semibold text-gray-900">Acesso negado</p>
        <p className="mt-2 text-sm text-gray-500">
          Voce nao pode avaliar este atendimento.
        </p>
      </div>
    );
  }

  if (appointment.status !== "completed") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-semibold text-gray-900">
          Atendimento nao concluido
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Somente atendimentos concluidos podem ser avaliados.
        </p>
      </div>
    );
  }

  // Check if already reviewed
  const { data: existingReview } = (await (supabase.from("reviews") as any)
    .select("id, rating, comment")
    .eq("appointment_id", appointmentId)
    .single()) as { data: any | null };

  if (existingReview) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
        <p className="text-lg font-semibold text-gray-900">
          Voce ja avaliou este atendimento
        </p>
        <div className="mt-4">
          <StarRating rating={existingReview.rating} readonly size="lg" />
        </div>
        {existingReview.comment && (
          <p className="mt-3 max-w-md text-sm text-gray-500">
            &quot;{existingReview.comment}&quot;
          </p>
        )}
      </div>
    );
  }

  // Build service names
  const serviceNames: string[] = [];
  let primaryServiceId = appointment.service_id;
  if (appointment.appointment_services?.length > 0) {
    for (const as_ of appointment.appointment_services) {
      if (as_.services?.name) serviceNames.push(as_.services.name);
      if (!primaryServiceId) primaryServiceId = as_.service_id;
    }
  } else if (appointment.services?.name) {
    serviceNames.push(appointment.services.name);
    if (!primaryServiceId) primaryServiceId = appointment.services.id;
  }

  const formattedDate = format(
    new Date(appointment.appointment_date + "T12:00:00"),
    "EEEE, d 'de' MMMM",
    { locale: ptBR }
  );

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Avaliar Atendimento</h1>

      <Card className="mb-6">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
            <CalendarDays className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <p className="font-semibold">
              {serviceNames.join(", ") || "Servico"}
            </p>
            <p className="text-sm text-muted-foreground">
              {formattedDate} as {appointment.start_time.slice(0, 5)}
            </p>
          </div>
        </CardContent>
      </Card>

      <ReviewFormClient
        appointmentId={appointmentId}
        serviceId={primaryServiceId}
      />
    </div>
  );
}
