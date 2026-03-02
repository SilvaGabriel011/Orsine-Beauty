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
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-warm-200 bg-white/90 shadow-lg backdrop-blur-sm hover:bg-white hover:border-gold-300 md:flex"
        onClick={() => scroll("left")}
      >
        <ChevronLeft className="h-4 w-4 text-warm-700" />
      </Button>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto px-1 py-3 scrollbar-hide"
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
            className="group w-[220px] flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-burgundy-600/5"
            style={{ scrollSnapAlign: "start" }}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-warm-100">
              {category.image_url ? (
                <Image
                  src={category.image_url}
                  alt={category.name}
                  width={220}
                  height={165}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-warm-100 to-warm-200">
                  <span className="font-serif text-5xl text-burgundy-200">
                    {category.name.charAt(0)}
                  </span>
                </div>
              )}
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-burgundy-900/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <div className="p-4">
              <h3 className="font-medium text-warm-900 transition-colors group-hover:text-burgundy-600">
                {category.name}
              </h3>
              <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium tracking-wide text-burgundy-500 transition-all group-hover:gap-2">
                View services
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-warm-200 bg-white/90 shadow-lg backdrop-blur-sm hover:bg-white hover:border-gold-300 md:flex"
        onClick={() => scroll("right")}
      >
        <ChevronRight className="h-4 w-4 text-warm-700" />
      </Button>
    </div>
  );
}
