"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { CalendarDays, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { safeFetch } from "@/lib/errors/client";

interface CancelarClientProps {
  appointment: {
    id: string;
    status: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    amount_paid: number;
    services: {
      name: string;
      price: number;
      duration_minutes: number;
      categories: { name: string } | null;
    } | null;
    appointment_services: {
      services: {
        name: string;
        price: number;
        duration_minutes: number;
        categories: { name: string } | null;
      } | null;
    }[];
  };
}

function getServiceNames(apt: CancelarClientProps["appointment"]): string {
  if (apt.appointment_services?.length > 0) {
    return apt.appointment_services
      .map((as_) => as_.services?.name)
      .filter(Boolean)
      .join(", ");
  }
  return apt.services?.name || "Servico";
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function CancelarClient({ appointment }: CancelarClientProps) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const isCancelled = appointment.status === "cancelled";
  const isCompleted = appointment.status === "completed";
  const isPast = isCancelled || isCompleted || appointment.status === "no_show";

  // Check 24h policy
  const appointmentDate = new Date(
    `${appointment.appointment_date}T${appointment.start_time}`
  );
  const now = new Date();
  const hoursUntil =
    (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const canCancel = hoursUntil >= 24 && !isPast;
  const tooLate = hoursUntil < 24 && hoursUntil > 0 && !isPast;

  async function handleCancel() {
    setCancelling(true);

    const result = await safeFetch(`/api/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });

    setCancelling(false);

    if (!result.ok) {
      toast.error("Erro ao cancelar agendamento. Tente novamente.");
      return;
    }

    setCancelled(true);
    toast.success("Agendamento cancelado com sucesso!");
  }

  if (cancelled) {
    return (
      <div className="mx-auto max-w-md py-12">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <h1 className="text-2xl font-bold">Cancelado com sucesso</h1>
            <p className="text-center text-muted-foreground">
              Seu agendamento foi cancelado. Voce recebera uma confirmacao por email.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push("/cliente/meus-agendamentos")}>
                Meus Agendamentos
              </Button>
              <Button className="bg-rose-600 hover:bg-rose-700" onClick={() => router.push("/agendar")}>
                Reagendar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPast ? (
              <XCircle className="h-6 w-6 text-gray-400" />
            ) : tooLate ? (
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            ) : (
              <CalendarDays className="h-6 w-6 text-rose-600" />
            )}
            Cancelar Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 space-y-2">
            <p className="font-semibold text-lg">{getServiceNames(appointment)}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {format(new Date(appointment.appointment_date + "T12:00:00"), "EEEE, dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
            </div>
            <p className="font-semibold text-rose-600">{formatPrice(appointment.amount_paid)}</p>
            <Badge
              className={
                isCancelled
                  ? "bg-red-100 text-red-800"
                  : isCompleted
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }
            >
              {isCancelled ? "Cancelado" : isCompleted ? "Concluido" : appointment.status === "no_show" ? "Nao compareceu" : "Confirmado"}
            </Badge>
          </div>

          {isPast && (
            <div className="rounded-lg bg-gray-100 p-4 text-center text-sm text-muted-foreground">
              {isCancelled
                ? "Este agendamento ja foi cancelado."
                : "Este agendamento ja foi concluido e nao pode ser cancelado."}
            </div>
          )}

          {tooLate && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-center text-sm">
              <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-500" />
              <p className="font-medium text-amber-800">
                Nao e possivel cancelar com menos de 24h de antecedencia.
              </p>
              <p className="mt-1 text-amber-700">
                Entre em contato pelo WhatsApp para solicitar o cancelamento.
              </p>
            </div>
          )}

          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelando..." : "Cancelar Agendamento"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar cancelamento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja cancelar o agendamento de{" "}
                    <strong>{getServiceNames(appointment)}</strong> em{" "}
                    {format(new Date(appointment.appointment_date + "T12:00:00"), "dd/MM/yyyy")}?
                    Esta acao nao pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Manter agendamento</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleCancel}
                  >
                    Sim, cancelar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/cliente/meus-agendamentos")}
          >
            Voltar para Meus Agendamentos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
