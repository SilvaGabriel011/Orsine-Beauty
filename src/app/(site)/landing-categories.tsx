"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types/database";

interface Props {
  categories: Category[];
}

export default function LandingCategoriesCarousel({ categories }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -280 : 280,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute -left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/80 shadow-md backdrop-blur-sm hover:bg-white md:flex"
        onClick={() => scroll("left")}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

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
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/agendar?category=${category.slug}`}
            className="group w-[200px] flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ scrollSnapAlign: "start" }}
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-rose-50">
              {category.image_url ? (
                <Image
                  src={category.image_url}
                  alt={category.name}
                  width={200}
                  height={150}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-4xl text-rose-200">
                    {category.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-rose-600">
                {category.name}
              </h3>
              <span className="mt-1 inline-flex items-center gap-1 text-xs text-rose-500">
                Ver servicos
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>

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
