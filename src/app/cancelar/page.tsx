"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CalendarDays, Clock, CheckCircle2, XCircle, Mail, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { enAU } from "date-fns/locale";
import { toast } from "sonner";
import { safeFetch } from "@/lib/errors/client";

interface Appointment {
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
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

export default function CancelarTokenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailConfirm, setEmailConfirm] = useState("");
  const [needEmailConfirm, setNeedEmailConfirm] = useState(false);

  const fetchAppointment = useCallback(async (appointmentId: string) => {
    setLoading(true);
    setError(null);

    const result = await safeFetch(`/api/appointments/${appointmentId}`);

    if (!result.ok) {
      setError("Booking not found");
      setLoading(false);
      return;
    }

    const apt = result.data as Appointment;
    
    // Verificar se pode ser cancelado
    const appointmentDate = new Date(
      `${apt.appointment_date}T${apt.start_time}`
    );
    const now = new Date();
    const hoursUntil =
      (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (apt.status === "cancelled") {
      setError("This booking has already been cancelled");
    } else if (apt.status === "completed" || apt.status === "no_show") {
      setError("This booking has already been completed");
    } else if (hoursUntil < 24) {
      setError("Cannot cancel less than 24 hours before the appointment");
    } else {
      setAppointment(apt);
      
      // Se não estiver logado, pedir confirmação de email
      if (!apt.profiles?.email) {
        setNeedEmailConfirm(true);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const initialize = async () => {
      if (!token) {
        setError("Token not provided");
        setLoading(false);
        return;
      }

      // Extrair ID do appointment do token ou buscar da URL
      const appointmentId = searchParams.get("id") || "";
      if (appointmentId) {
        await fetchAppointment(appointmentId);
      } else {
        setError("Booking ID not provided");
        setLoading(false);
      }
    };

    initialize();
  }, [token, searchParams, fetchAppointment]);

  async function handleCancel() {
    if (!appointment || !token) return;

    // Se precisar confirmar email
    if (needEmailConfirm && emailConfirm !== appointment.profiles?.email) {
      toast.error("Email does not match the booking");
      return;
    }

    setCancelling(true);

    const result = await safeFetch(`/api/appointments/${appointment.id}/cancel-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    setCancelling(false);

    if (!result.ok) {
      if (result.error?.code === "AUTH_INVALID_TOKEN") {
        setError("Invalid or expired token");
      } else if (result.error?.code === "APPT_CANCEL_TOO_LATE") {
        setError("Cannot cancel less than 24 hours before the appointment");
      } else {
        setError(result.error?.message || "Error cancelling booking");
      }
      return;
    }

    setCancelled(true);
    toast.success("Booking cancelled successfully!");
  }

  function getServiceNames(apt: Appointment): string {
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <XCircle className="h-16 w-16 text-red-500" />
            <h1 className="text-xl font-bold text-center">Error</h1>
            <p className="text-center text-muted-foreground">{error}</p>
            <Button onClick={() => router.push("/")}>
              Back to site
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <h1 className="text-2xl font-bold">Successfully Cancelled</h1>
            <p className="text-center text-muted-foreground">
              Your booking has been cancelled. You will receive a confirmation by email.
            </p>
            <Button onClick={() => router.push("/agendar")}>
              Book a new appointment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!appointment) return null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-rose-600" />
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
            <Badge className="bg-blue-100 text-blue-800">
              Confirmed
            </Badge>
          </div>

          {needEmailConfirm && (
            <div className="space-y-2">
              <Label htmlFor="email">Confirm your email to cancel</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={emailConfirm}
                  onChange={(e) => setEmailConfirm(e.target.value)}
                />
                <Mail className="h-4 w-4 text-muted-foreground mt-2.5" />
              </div>
            </div>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full"
                disabled={cancelling || (needEmailConfirm && !emailConfirm)}
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

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/")}
          >
            Back to site
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
