"use client";

import Image from "next/image";
import { Clock, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(service.price);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-rose-50">
        {service.image_url ? (
          <Image
            src={service.image_url}
            alt={service.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl text-rose-200">
              {service.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Cart indicator badge */}
        {isInCart && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white shadow-md">
            <Check className="h-3 w-3" />
            No carrinho
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category tag */}
        {service.categories?.name && (
          <span className="mb-1 text-[11px] font-medium uppercase tracking-wider text-rose-500">
            {service.categories.name}
          </span>
        )}

        {/* Name */}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
          {service.name}
        </h3>

        {/* Description */}
        {service.description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Bottom row: duration + price + button */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-rose-600">
              {formattedPrice}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Clock className="h-3 w-3" />
              {service.duration_minutes} min
            </span>
          </div>

          {isInCart ? (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={(e) => {
                e.preventDefault();
                onRemove();
              }}
            >
              Remover
            </Button>
          ) : (
            <Button
              size="sm"
              className="shrink-0 bg-rose-600 text-white hover:bg-rose-700"
              onClick={(e) => {
                e.preventDefault();
                onAdd();
              }}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Adicionar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
