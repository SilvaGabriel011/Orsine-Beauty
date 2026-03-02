"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PagamentoSucessoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get("appointment_id");
  const isMock = searchParams.get("mock") === "true";
  const [countdown, setCountdown] = useState(8);

  // Countdown redirect para meus agendamentos
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/cliente/meus-agendamentos");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Payment confirmed!
            </h1>
            <p className="mt-2 text-gray-500 text-sm">
              Your booking has been confirmed and the payment processed successfully.
              You will receive a confirmation by email and SMS.
            </p>
            {isMock && (
              <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
                Test mode — simulated payment
              </p>
            )}
          </div>

          <div className="flex w-full flex-col gap-3">
            <Button asChild className="bg-rose-500 hover:bg-rose-600 text-white w-full">
              <Link href="/cliente/meus-agendamentos">
                <Calendar className="mr-2 h-4 w-4" />
                View my bookings
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/agendar">Book another service</Link>
            </Button>
          </div>

          <p className="text-xs text-gray-400">
            Redirecting in {countdown}s...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
