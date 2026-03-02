"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, RefreshCw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PagamentoFalhaPage() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointment_id");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Payment not processed
            </h1>
            <p className="mt-2 text-gray-500 text-sm">
              We were unable to process your payment. Your booking is still
              reserved — you can try again or pay in person.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3">
            {appointmentId && (
              <Button
                className="bg-rose-500 hover:bg-rose-600 text-white w-full"
                onClick={async () => {
                  const res = await fetch("/api/payments/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ appointment_id: appointmentId }),
                  });
                  const data = await res.json();
                  if (data.checkout_url) {
                    window.location.href = data.checkout_url;
                  }
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href="/cliente/meus-agendamentos">
                View my bookings
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full text-sm text-gray-500">
              <a href="tel:+61000000000">
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact the studio
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
