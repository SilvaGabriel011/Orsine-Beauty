"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export default function StarRating({
  rating,
  onChange,
  size = "md",
  readonly = false,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const isInput = !readonly && !!onChange;
  const displayRating = isInput && hoverRating > 0 ? hoverRating : rating;

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      onMouseLeave={() => isInput && setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={cn(
            "transition-colors",
            isInput && "cursor-pointer hover:scale-110 transition-transform"
          )}
          onClick={() => isInput && onChange(star)}
          onMouseEnter={() => isInput && setHoverRating(star)}
        >
          <Star
            className={cn(
              sizeMap[size],
              star <= displayRating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}
