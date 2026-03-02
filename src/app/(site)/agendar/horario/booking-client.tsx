"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Check } from "lucide-react";
import { toast } from "sonner";
import { safeFetch } from "@/lib/errors/client";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { enAU } from "date-fns/locale";
import Link from "next/link";

interface TimeSlot {
  start: string;
  end: string;
}

interface ServiceData {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description: string | null;
  categories: { id: string; name: string; slug: string } | null;
}

export function BookingClient({
  service,
  isLoggedIn,
}: {
  service: ServiceData;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    if (!selectedDate) return;

    setLoadingSlots(true);
    setSelectedSlot(null);
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const fetchSlots = async () => {
      const result = await safeFetch<{ slots: TimeSlot[] }>(
        `/api/availability?serviceId=${service.id}&date=${dateStr}`
      );

      if (!result.ok) {
        setSlots([]);
      } else {
        setSlots(result.data.slots || []);
      }

      setLoadingSlots(false);
    };

    fetchSlots();
  }, [selectedDate, service.id]);

  async function handleBook() {
    if (!isLoggedIn) {
      router.push(
        `/auth/login?redirect=/agendar/horario?service=${service.id}`
      );
      return;
    }

    if (!selectedDate || !selectedSlot) return;

    setBooking(true);

    const result = await safeFetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: service.id,
        appointment_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        payment_method: "presencial",
      }),
    });

    setBooking(false);

    if (!result.ok) return;

    setBooked(true);
    toast.success("Booking confirmed!");
  }

  function formatPrice(value: number) {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(value);
  }

  if (booked) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Booking Confirmed!</h1>
        <p className="mt-3 text-muted-foreground">
          Your booking for <strong>{service.name}</strong> on{" "}
          <strong>
            {selectedDate &&
              format(selectedDate, "dd/MM/yyyy (EEEE)", { locale: enAU })}
          </strong>{" "}
          at <strong>{selectedSlot?.start}</strong> has been confirmed.
        </p>
        <p className="mt-2 text-muted-foreground">
          You will receive a confirmation email.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
          <Link href="/cliente/meus-agendamentos">
            <Button className="bg-rose-600 hover:bg-rose-700">
              My Bookings
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Link
        href={`/agendar/${service.categories?.slug || ""}`}
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Select Time Slot</h1>
        <div className="mt-2 flex items-center gap-4">
          <Badge variant="secondary">{service.categories?.name}</Badge>
          <span className="font-medium">{service.name}</span>
          <span className="text-rose-600 font-semibold">
            {formatPrice(service.price)}
          </span>
          <span className="text-sm text-muted-foreground">
            <Clock className="mr-1 inline h-3 w-3" />
            {service.duration_minutes} min
          </span>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Choose a Date</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={enAU}
              disabled={(date) =>
                isBefore(date, startOfDay(new Date())) ||
                date.getDay() === 0 // Disable Sundays
              }
              fromDate={new Date()}
              toDate={addDays(new Date(), 60)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? `Time Slots - ${format(selectedDate, "dd/MM (EEE)", { locale: enAU })}`
                : "Select a date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate && (
              <p className="py-8 text-center text-muted-foreground">
                Select a date on the calendar
              </p>
            )}

            {selectedDate && loadingSlots && (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-200 border-t-rose-600" />
              </div>
            )}

            {selectedDate && !loadingSlots && slots.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                No time slots available on this date
              </p>
            )}

            {selectedDate && !loadingSlots && slots.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <Button
                    key={slot.start}
                    variant={
                      selectedSlot?.start === slot.start
                        ? "default"
                        : "outline"
                    }
                    className={
                      selectedSlot?.start === slot.start
                        ? "bg-rose-600 hover:bg-rose-700"
                        : ""
                    }
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot.start}
                  </Button>
                ))}
              </div>
            )}

            {selectedSlot && (
              <div className="mt-6 rounded-lg border bg-rose-50 p-4">
                <h3 className="font-semibold">Summary</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    <strong>Service:</strong> {service.name}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {format(selectedDate!, "dd/MM/yyyy (EEEE)", {
                      locale: enAU,
                    })}
                  </p>
                  <p>
                    <strong>Time:</strong> {selectedSlot.start} -{" "}
                    {selectedSlot.end}
                  </p>
                  <p>
                    <strong>Price:</strong> {formatPrice(service.price)}
                  </p>
                </div>
                <Button
                  className="mt-4 w-full bg-rose-600 hover:bg-rose-700"
                  onClick={handleBook}
                  disabled={booking}
                >
                  {booking
                    ? "Booking..."
                    : isLoggedIn
                      ? "Confirm Booking"
                      : "Log In to Book"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
