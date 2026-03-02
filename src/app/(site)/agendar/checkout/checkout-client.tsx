"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { enAU } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { safeFetch } from "@/lib/errors/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CartSummary from "@/components/marketplace/CartSummary";
import LoyaltyBanner from "@/components/marketplace/LoyaltyBanner";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";

interface TimeSlot {
  start: string;
  end: string;
}

export default function CheckoutClient() {
  const router = useRouter();
  const { items, totalPrice, totalDuration, itemCount, clearCart, isHydrated } =
    useCart();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [discountRuleId, setDiscountRuleId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"presencial" | "online">("presencial");

  // Check auth
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setCheckingAuth(false);
    }
    checkAuth();
  }, []);

  // Redirect to marketplace if cart is empty (after hydration)
  useEffect(() => {
    if (isHydrated && itemCount === 0 && !success) {
      router.push("/agendar");
    }
  }, [isHydrated, itemCount, success, router]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (!selectedDate || totalDuration === 0) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);

      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const result = await safeFetch<{ slots: TimeSlot[] }>(
        `/api/availability?date=${dateStr}&duration=${totalDuration}`
      );

      if (!result.ok) {
        setSlots([]);
      } else {
        setSlots(result.data.slots || []);
      }

      setLoadingSlots(false);
    };

    fetchSlots();
  }, [selectedDate, totalDuration]);

  // Handle booking
  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot || !user) return;

    setBooking(true);

    const result = await safeFetch<{ id: string }>("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        services: items.map((item) => ({
          service_id: item.service.id,
        })),
        appointment_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        payment_method: paymentMethod,
        discount_applied: discount,
      }),
    });

    setBooking(false);

    if (!result.ok) return;

    setSuccess(true);
    clearCart();
    toast.success("Booking confirmed!");

    // Se pagamento online, redirecionar para gateway
    if (paymentMethod === "online" && result.data?.id) {
      const payRes = await safeFetch<{ checkout_url: string }>("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: result.data.id }),
      });
      if (payRes.ok && payRes.data.checkout_url) {
        window.location.href = payRes.data.checkout_url;
        return;
      }
    }
  };

  // Loading state
  if (!isHydrated || checkingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Booking confirmed!
          </h1>
          <p className="mt-2 text-gray-600">
            Your services have been successfully booked. You will receive a
            reminder by email.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/cliente/meus-agendamentos">
              <Button className="w-full bg-rose-600 text-white hover:bg-rose-700 sm:w-auto">
                View my bookings
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart
  if (itemCount === 0) {
    return null; // Will redirect via useEffect
  }

  const formattedTotal = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(totalPrice);

  // Disable dates: past, sundays, >60 days out
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);

  const isDisabled = (date: Date) => {
    return date < today || date > maxDate || date.getDay() === 0;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
          <Link href="/agendar">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Complete Booking
            </h1>
            <p className="text-xs text-gray-500">
              Choose a date and time
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
          {/* Main content */}
          <div className="space-y-6">
            {/* Cart Summary */}
            <CartSummary />

            {/* Loyalty Discount */}
            <LoyaltyBanner
              onDiscount={(d, ruleId) => {
                setDiscount(d);
                setDiscountRuleId(ruleId);
              }}
              appliedDiscount={discount}
            />

            {/* Date Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarIcon className="h-4 w-4 text-rose-600" />
                  Choose a date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={enAU}
                  disabled={isDisabled}
                  className="mx-auto"
                />
              </CardContent>
            </Card>

            {/* Time Slots */}
            {selectedDate && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4 text-rose-600" />
                    Available time slots
                    <span className="ml-auto text-xs font-normal text-gray-500">
                      {format(selectedDate, "d MMMM", { locale: enAU })}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
                      <span className="ml-2 text-sm text-gray-500">
                        Loading time slots...
                      </span>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="py-8 text-center">
                      <Clock className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                      <p className="text-sm text-gray-500">
                        No time slots available on this date
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Try another date
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {slots.map((slot) => (
                        <button
                          key={slot.start}
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                            selectedSlot?.start === slot.start
                              ? "border-rose-600 bg-rose-600 text-white shadow-lg shadow-rose-200"
                              : "border-gray-200 bg-white text-gray-700 hover:border-rose-300 hover:bg-rose-50"
                          }`}
                        >
                          {slot.start.slice(0, 5)}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Método de pagamento */}
            <div className="rounded-xl border bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Payment method</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("presencial")}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 text-center transition-all ${
                    paymentMethod === "presencial"
                      ? "border-rose-500 bg-rose-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">🏪</span>
                  <span className="text-sm font-medium text-gray-900">In-person</span>
                  <span className="text-xs text-gray-500">Pay at the studio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("online")}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 text-center transition-all ${
                    paymentMethod === "online"
                      ? "border-rose-500 bg-rose-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">💳</span>
                  <span className="text-sm font-medium text-gray-900">Online</span>
                  <span className="text-xs text-gray-500">Card or transfer now</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar: Confirmation */}
          <div className="lg:sticky lg:top-24">
            <Card className="border-rose-100 bg-rose-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Booking summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Services */}
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div
                      key={item.service.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700">
                        {item.service.name}
                      </span>
                      <span className="font-medium text-gray-900">
                        {new Intl.NumberFormat("en-AU", {
                          style: "currency",
                          currency: "AUD",
                        }).format(item.service.price)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-rose-200/50 pt-2">
                  {/* Duration */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Estimated duration
                    </span>
                    <span>{totalDuration} min</span>
                  </div>

                  {/* Date */}
                  {selectedDate && (
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        Data
                      </span>
                      <span>
                        {format(selectedDate, "dd/MM/yyyy")}
                      </span>
                    </div>
                  )}

                  {/* Time */}
                  {selectedSlot && (
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Time
                      </span>
                      <span>
                        {selectedSlot.start.slice(0, 5)} -{" "}
                        {selectedSlot.end.slice(0, 5)}
                      </span>
                    </div>
                  )}

                  {/* Discount */}
                  {discount > 0 && (
                    <div className="mt-1 flex items-center justify-between text-xs text-green-600">
                      <span>Loyalty discount</span>
                      <span>
                        -{" "}
                        {new Intl.NumberFormat("en-AU", {
                          style: "currency",
                          currency: "AUD",
                        }).format(discount)}
                      </span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="mt-3 flex items-center justify-between border-t border-rose-200/50 pt-2">
                    <span className="font-medium text-gray-900">Total</span>
                    <span className="text-xl font-bold text-rose-600">
                      {new Intl.NumberFormat("en-AU", {
                        style: "currency",
                        currency: "AUD",
                      }).format(Math.max(0, totalPrice - discount))}
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                {!user ? (
                  <Link
                    href={`/auth/login?redirect=/agendar/checkout`}
                    className="block"
                  >
                    <Button className="w-full bg-rose-600 text-white hover:bg-rose-700">
                      Log in to book
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className="w-full bg-rose-600 text-white hover:bg-rose-700"
                    disabled={!selectedDate || !selectedSlot || booking}
                    onClick={handleBooking}
                  >
                    {booking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Confirm booking
                      </>
                    )}
                  </Button>
                )}

                {!selectedDate && (
                  <p className="text-center text-xs text-gray-400">
                    Select a date to see available times
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
