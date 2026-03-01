"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types/database";

interface CategoryCarouselProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export default function CategoryCarousel({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative w-full">
      {/* Left arrow (desktop only) */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/80 shadow-md backdrop-blur-sm hover:bg-white md:flex"
        onClick={() => scroll("left")}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Scrollable strip */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-1 py-2 scrollbar-hide"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {/* "Todos" pill */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex flex-shrink-0 flex-col items-center gap-1.5 rounded-2xl px-4 py-3 transition-all ${
            selectedCategoryId === null
              ? "bg-rose-600 text-white shadow-lg shadow-rose-200"
              : "bg-white text-gray-700 shadow-sm hover:bg-rose-50 hover:shadow-md"
          }`}
          style={{ scrollSnapAlign: "start" }}
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              selectedCategoryId === null
                ? "bg-white/20"
                : "bg-rose-50"
            }`}
          >
            <LayoutGrid
              className={`h-5 w-5 ${
                selectedCategoryId === null
                  ? "text-white"
                  : "text-rose-600"
              }`}
            />
          </div>
          <span className="whitespace-nowrap text-xs font-medium">Todos</span>
        </button>

        {/* Category pills */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`flex flex-shrink-0 flex-col items-center gap-1.5 rounded-2xl px-4 py-3 transition-all ${
              selectedCategoryId === category.id
                ? "bg-rose-600 text-white shadow-lg shadow-rose-200"
                : "bg-white text-gray-700 shadow-sm hover:bg-rose-50 hover:shadow-md"
            }`}
            style={{ scrollSnapAlign: "start" }}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ${
                selectedCategoryId === category.id
                  ? "bg-white/20"
                  : "bg-rose-50"
              }`}
            >
              {category.image_url ? (
                <Image
                  src={category.image_url}
                  alt={category.name}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg">
                  {category.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="whitespace-nowrap text-xs font-medium">
              {category.name}
            </span>
          </button>
        ))}
      </div>

      {/* Right arrow (desktop only) */}
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
