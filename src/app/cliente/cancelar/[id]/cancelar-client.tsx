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
import { enAU } from "date-fns/locale";
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
  return apt.services?.name || "Service";
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
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
      toast.error("Error cancelling booking. Please try again.");
      return;
    }

    setCancelled(true);
    toast.success("Booking cancelled successfully!");
  }

  if (cancelled) {
    return (
      <div className="mx-auto max-w-md py-12">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <h1 className="text-2xl font-bold">Successfully Cancelled</h1>
            <p className="text-center text-muted-foreground">
              Your booking has been cancelled. You will receive a confirmation by email.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push("/cliente/meus-agendamentos")}>
                My Bookings
              </Button>
              <Button className="bg-rose-600 hover:bg-rose-700" onClick={() => router.push("/agendar")}>
                Rebook
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
            Cancel Booking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 space-y-2">
            <p className="font-semibold text-lg">{getServiceNames(appointment)}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {format(new Date(appointment.appointment_date + "T12:00:00"), "EEEE, d MMMM yyyy", {
                locale: enAU,
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
              {isCancelled ? "Cancelled" : isCompleted ? "Completed" : appointment.status === "no_show" ? "No show" : "Confirmed"}
            </Badge>
          </div>

          {isPast && (
            <div className="rounded-lg bg-gray-100 p-4 text-center text-sm text-muted-foreground">
              {isCancelled
                ? "This booking has already been cancelled."
                : "This booking has already been completed and cannot be cancelled."}
            </div>
          )}

          {tooLate && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-center text-sm">
              <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-500" />
              <p className="font-medium text-amber-800">
                Cannot cancel less than 24 hours before the appointment.
              </p>
              <p className="mt-1 text-amber-700">
                Please contact us via WhatsApp to request a cancellation.
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
                  {cancelling ? "Cancelling..." : "Cancel Booking"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm cancellation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel the booking for{" "}
                    <strong>{getServiceNames(appointment)}</strong> on{" "}
                    {format(new Date(appointment.appointment_date + "T12:00:00"), "dd/MM/yyyy")}?
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep booking</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleCancel}
                  >
                    Yes, cancel
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
            Back to My Bookings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
