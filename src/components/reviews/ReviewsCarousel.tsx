"use client";

import { Card, CardContent } from "@/components/ui/card";
import StarRating from "./StarRating";

interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
  services: { name: string } | null;
}

export default function ReviewsCarousel({
  reviews,
}: {
  reviews: ReviewData[];
}) {
  if (reviews.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {reviews.map((review) => (
        <Card
          key={review.id}
          className="min-w-[280px] max-w-[320px] shrink-0"
        >
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600">
                {review.profiles?.full_name
                  ? review.profiles.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "?"}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {review.profiles?.full_name || "Cliente"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {review.services?.name}
                </p>
              </div>
            </div>
            <StarRating rating={review.rating} readonly size="sm" />
            {review.comment && (
              <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                &ldquo;{review.comment}&rdquo;
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
