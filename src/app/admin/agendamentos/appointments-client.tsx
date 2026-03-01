"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { safeFetch } from "@/lib/errors/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: string;
  client_id: string;
  service_id: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  amount_paid: number;
  discount_applied: number;
  total_duration: number | null;
  notes: string | null;
  services: {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
    categories: { id: string; name: string } | null;
  } | null;
  appointment_services?: {
    id: string;
    service_id: string;
    price_at_booking: number;
    duration_at_booking: number;
    services: {
      id: string;
      name: string;
      categories: { id: string; name: string } | null;
    };
  }[];
  profiles: {
    id: string;
    full_name: string;
    phone: string | null;
    email: string;
  } | null;
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

export function AppointmentsClient({
  initialAppointments,
}: {
  initialAppointments: Appointment[];
}) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered =
    filterStatus === "all"
      ? initialAppointments
      : initialAppointments.filter((a) => a.status === filterStatus);

  async function updateStatus(id: string, status: string) {
    const result = await safeFetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!result.ok) return;

    toast.success(`Status atualizado para: ${statusLabels[status]}`);
    router.refresh();
  }

  function formatDate(dateStr: string) {
    return format(new Date(dateStr + "T12:00:00"), "dd/MM/yyyy (EEE)", {
      locale: ptBR,
    });
  }

  function formatPrice(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Agendamentos</h1>
        <p className="text-muted-foreground">
          Gerencie os agendamentos do estudio
        </p>
      </div>

      <div className="mb-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="confirmed">Confirmados</SelectItem>
            <SelectItem value="completed">Concluidos</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Servico(s)</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum agendamento encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell>{formatDate(apt.appointment_date)}</TableCell>
                  <TableCell>
                    {apt.start_time.slice(0, 5)} - {apt.end_time.slice(0, 5)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {apt.profiles?.full_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {apt.profiles?.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {apt.appointment_services && apt.appointment_services.length > 0 ? (
                      <div className="space-y-0.5">
                        {apt.appointment_services.map((as_item) => (
                          <div key={as_item.id} className="text-sm">
                            <span>{as_item.services?.name}</span>
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({as_item.services?.categories?.name})
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <div>{apt.services?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {apt.services?.categories?.name}
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatPrice(apt.amount_paid)}
                    {apt.discount_applied > 0 && (
                      <div className="text-xs text-green-600">
                        -{formatPrice(apt.discount_applied)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[apt.status] || ""}>
                      {statusLabels[apt.status] || apt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {apt.status !== "completed" && (
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatus(apt.id, "completed")
                            }
                          >
                            <Check className="mr-2 h-4 w-4 text-green-600" />
                            Marcar como Concluido
                          </DropdownMenuItem>
                        )}
                        {apt.status !== "cancelled" && (
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatus(apt.id, "cancelled")
                            }
                          >
                            <X className="mr-2 h-4 w-4 text-red-600" />
                            Cancelar
                          </DropdownMenuItem>
                        )}
                        {apt.status !== "no_show" && (
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatus(apt.id, "no_show")
                            }
                          >
                            <Clock className="mr-2 h-4 w-4 text-gray-600" />
                            Nao Compareceu
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
