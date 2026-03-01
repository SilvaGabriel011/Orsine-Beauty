"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Clock, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import type { Service } from "@/types/database";

interface PopularServicesCarouselProps {
  services: (Service & { categories?: { name: string } })[];
}

export default function PopularServicesCarousel({
  services,
}: PopularServicesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addItem, removeItem, isInCart } = useCart();

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 280;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (services.length === 0) return null;

  return (
    <div className="relative w-full">
      {/* Left arrow */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/80 shadow-md backdrop-blur-sm hover:bg-white md:flex"
        onClick={() => scroll("left")}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Scrollable cards */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto px-1 py-2 scrollbar-hide"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {services.map((service) => {
          const inCart = isInCart(service.id);
          const formattedPrice = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(service.price);

          return (
            <div
              key={service.id}
              className="w-[240px] flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ scrollSnapAlign: "start" }}
            >
              {/* Image */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-rose-50">
                {service.image_url ? (
                  <Image
                    src={service.image_url}
                    alt={service.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-3xl text-rose-200">
                      {service.name.charAt(0)}
                    </span>
                  </div>
                )}
                {inCart && (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-medium text-white">
                    <Check className="h-2.5 w-2.5" />
                    No carrinho
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3">
                {service.categories?.name && (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-rose-500">
                    {service.categories.name}
                  </span>
                )}
                <h3 className="mt-0.5 text-sm font-semibold text-gray-900 line-clamp-1">
                  {service.name}
                </h3>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-rose-600">
                      {formattedPrice}
                    </span>
                    <span className="ml-1.5 flex items-center gap-0.5 text-[10px] text-gray-400">
                      <Clock className="h-2.5 w-2.5" />
                      {service.duration_minutes}min
                    </span>
                  </div>
                  {inCart ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-red-200 px-2 text-xs text-red-600 hover:bg-red-50"
                      onClick={() => removeItem(service.id)}
                    >
                      Remover
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="h-8 bg-rose-600 px-2 text-xs text-white hover:bg-rose-700"
                      onClick={() => addItem(service)}
                    >
                      <Plus className="mr-0.5 h-3 w-3" />
                      Adicionar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right arrow */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/80 shadow-md backdrop-blur-sm hover:bg-white md:flex"
        onClick={() => scroll("right")}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
