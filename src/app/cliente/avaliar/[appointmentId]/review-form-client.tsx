"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { safeFetch } from "@/lib/errors/client";
import StarRating from "@/components/reviews/StarRating";

export default function ReviewFormClient({
  appointmentId,
  serviceId,
}: {
  appointmentId: string;
  serviceId: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating from 1 to 5 stars");
      return;
    }

    setLoading(true);

    const result = await safeFetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointment_id: appointmentId,
        rating,
        comment: comment.trim() || null,
      }),
    });

    setLoading(false);

    if (!result.ok) return;

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
        <h2 className="text-xl font-bold text-gray-900">
          Thank you for your review!
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Your feedback is very important to us.
        </p>
        <div className="mt-4">
          <StarRating rating={rating} readonly size="lg" />
        </div>
        <Button
          className="mt-6 bg-rose-600 hover:bg-rose-700"
          onClick={() => router.push("/cliente/meus-agendamentos")}
        >
          Back to Bookings
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>How was your experience?</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-2">
            <Label className="text-base">Your rating</Label>
            <StarRating rating={rating} onChange={setRating} size="lg" />
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 1 && "Very poor"}
                {rating === 2 && "Poor"}
                {rating === 3 && "Average"}
                {rating === 4 && "Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="comment">
              Comment (optional)
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              rows={4}
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || rating === 0}
            className="w-full bg-rose-600 hover:bg-rose-700"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
