"use client";

import Image from "next/image";
import { Clock, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BLUR_ROSE } from "@/lib/image-blur";
import type { Service } from "@/types/database";

interface MarketplaceServiceCardProps {
  service: Service & { categories?: { name: string } };
  isInCart: boolean;
  onAdd: () => void;
  onRemove: () => void;
}

export default function MarketplaceServiceCard({
  service,
  isInCart,
  onAdd,
  onRemove,
}: MarketplaceServiceCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(service.price);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-burgundy-600/5 border border-warm-200/50">
      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-warm-100">
        {service.image_url ? (
          <Image
            src={service.image_url}
            alt={service.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            placeholder="blur"
            blurDataURL={BLUR_ROSE}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-warm-100 to-warm-200">
            <span className="font-serif text-4xl text-burgundy-200">
              {service.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-burgundy-900/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Cart indicator badge */}
        {isInCart && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white shadow-md">
            <Check className="h-3 w-3" />
            In cart
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category tag */}
        {service.categories?.name && (
          <span className="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-gold-500">
            {service.categories.name}
          </span>
        )}

        {/* Name */}
        <h3 className="text-sm font-semibold text-warm-900 line-clamp-1">
          {service.name}
        </h3>

        {/* Description */}
        {service.description && (
          <p className="mt-1 text-xs text-warm-500 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Bottom row: duration + price + button */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-burgundy-600">
              {formattedPrice}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-warm-400">
              <Clock className="h-3 w-3" />
              {service.duration_minutes} min
            </span>
          </div>

          {isInCart ? (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={(e) => {
                e.preventDefault();
                onRemove();
              }}
            >
              Remove
            </Button>
          ) : (
            <Button
              size="sm"
              className="shrink-0 rounded-full bg-burgundy-600 text-white hover:bg-burgundy-700 shadow-sm shadow-burgundy-600/10"
              onClick={(e) => {
                e.preventDefault();
                onAdd();
              }}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
