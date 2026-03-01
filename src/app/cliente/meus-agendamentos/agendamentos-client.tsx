"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalendarDays, Clock, Star, RefreshCw, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { safeFetch } from "@/lib/errors/client";
import StarRating from "@/components/reviews/StarRating";
import RescheduleModal from "@/components/agendamentos/RescheduleModal";

interface Appointment {
  id: string;
  status: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  amount_paid: number;
  service_id: string | null;
  services: {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
    categories: { id: string; name: string } | null;
  } | null;
  appointment_services: {
    service_id: string;
    services: {
      id: string;
      name: string;
      price: number;
      duration_minutes: number;
      categories: { id: string; name: string } | null;
    } | null;
  }[];
  review: { id: string; rating: number } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluido",
  cancelled: "Cancelado",
  no_show: "Nao compareceu",
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getServiceNames(apt: Appointment): string {
  if (apt.appointment_services?.length > 0) {
    return apt.appointment_services
      .map((as_) => as_.services?.name)
      .filter(Boolean)
      .join(", ");
  }
  return apt.services?.name || "Servico";
}

function getCategoryName(apt: Appointment): string | null {
  if (apt.appointment_services?.length > 0) {
    return apt.appointment_services[0]?.services?.categories?.name || null;
  }
  return apt.services?.categories?.name || null;
}

function canCancel(apt: Appointment): boolean {
  const appointmentDate = new Date(
    `${apt.appointment_date}T${apt.start_time}`
  );
  const now = new Date();
  const hoursUntil =
    (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntil >= 24;
}

export default function AgendamentosClient({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const upcoming = appointments.filter(
    (a) =>
      a.status !== "cancelled" &&
      a.status !== "completed" &&
      a.status !== "no_show"
  );

  const past = appointments.filter(
    (a) =>
      a.status === "cancelled" ||
      a.status === "completed" ||
      a.status === "no_show"
  );

  function canReschedule(apt: Appointment): boolean {
    return canCancel(apt);
  }

  function openRescheduleModal(apt: Appointment) {
    setSelectedAppointment(apt);
    setRescheduleOpen(true);
  }

  async function handleCancel(id: string) {
    setCancellingId(id);

    const result = await safeFetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });

    setCancellingId(null);

    if (!result.ok) return;

    toast.success("Agendamento cancelado com sucesso");
    router.refresh();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Meus Agendamentos</h1>

      <h2 className="mb-4 text-lg font-semibold">Proximos</h2>
      {upcoming.length === 0 ? (
        <p className="mb-8 text-muted-foreground">
          Nenhum agendamento proximo.
        </p>
      ) : (
        <div className="mb-8 space-y-3">
          {upcoming.map((apt) => (
            <Card key={apt.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100">
                    <CalendarDays className="h-6 w-6 text-rose-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{getServiceNames(apt)}</p>
                    {getCategoryName(apt) && (
                      <p className="text-sm text-muted-foreground">
                        {getCategoryName(apt)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {format(
                      new Date(apt.appointment_date + "T12:00:00"),
                      "dd/MM/yyyy",
                      { locale: ptBR }
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="mr-1 inline h-3 w-3" />
                    {apt.start_time.slice(0, 5)} - {apt.end_time.slice(0, 5)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-semibold text-rose-600">
                    {formatPrice(apt.amount_paid)}
                  </p>
                  <Badge className={statusColors[apt.status]}>
                    {statusLabels[apt.status]}
                  </Badge>
                  {canReschedule(apt) && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => openRescheduleModal(apt)}
                      >
                        <Calendar className="h-3 w-3" />
                        Reagendar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={cancellingId === apt.id}
                          >
                            {cancellingId === apt.id
                              ? "Cancelando..."
                              : "Cancelar"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Cancelar agendamento?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja cancelar o agendamento de{" "}
                              <strong>{getServiceNames(apt)}</strong> em{" "}
                              {format(
                                new Date(apt.appointment_date + "T12:00:00"),
                                "dd/MM/yyyy"
                              )}
                              ? Esta acao nao pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Manter</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleCancel(apt.id)}
                            >
                              Sim, cancelar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold">Historico</h2>
      {past.length === 0 ? (
        <p className="text-muted-foreground">Nenhum historico.</p>
      ) : (
        <div className="space-y-3">
          {past.map((apt) => (
            <Card key={apt.id} className="opacity-80">
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <CalendarDays className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold">{getServiceNames(apt)}</p>
                    {getCategoryName(apt) && (
                      <p className="text-sm text-muted-foreground">
                        {getCategoryName(apt)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {format(
                      new Date(apt.appointment_date + "T12:00:00"),
                      "dd/MM/yyyy",
                      { locale: ptBR }
                    )}
                  </p>
                  <Badge className={statusColors[apt.status]}>
                    {statusLabels[apt.status]}
                  </Badge>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {apt.status === "completed" && !apt.review && (
                    <Button
                      size="sm"
                      className="bg-rose-600 hover:bg-rose-700"
                      onClick={() =>
                        router.push(`/cliente/avaliar/${apt.id}`)
                      }
                    >
                      <Star className="mr-1 h-4 w-4" />
                      Avaliar
                    </Button>
                  )}
                  {apt.review && (
                    <div className="flex items-center gap-1">
                      <StarRating
                        rating={apt.review.rating}
                        readonly
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Reagendamento */}
      {selectedAppointment && (
        <RescheduleModal
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
          appointment={selectedAppointment}
        />
      )}
    </div>
  );
}
