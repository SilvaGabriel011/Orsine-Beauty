"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StarRating from "@/components/reviews/StarRating";

interface Testimonial {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
  services: {
    name: string;
    categories: {
      name: string;
    } | null;
  } | null;
}

interface TestimonialCarouselProps {
  testimonials?: Testimonial[];
  loading?: boolean;
}

export default function TestimonialCarousel({ 
  testimonials = [], 
  loading = false 
}: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  // Pegar apenas os 6 melhores depoimentos
  const topTestimonials = testimonials.slice(0, 6);

  useEffect(() => {
    if (!autoplay || topTestimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % topTestimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoplay, topTestimonials.length]);

  const goToPrevious = () => {
    setAutoplay(false);
    setCurrentIndex((prev) => 
      prev === 0 ? topTestimonials.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setAutoplay(false);
    setCurrentIndex((prev) => (prev + 1) % topTestimonials.length);
  };

  const goToSlide = (index: number) => {
    setAutoplay(false);
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              What our clients say
            </h2>
          </div>
          <div className="animate-pulse">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (topTestimonials.length === 0) {
    return null;
  }

  const currentTestimonial = topTestimonials[currentIndex];
  const initials = currentTestimonial.profiles?.full_name
    ? currentTestimonial.profiles.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <section className="relative py-20 sm:py-28 bg-gradient-to-br from-warm-800 via-burgundy-800/90 to-warm-900">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[20%] h-48 w-48 rounded-full bg-burgundy-600/15 blur-[80px]" />
        <div className="absolute right-[15%] bottom-[20%] h-36 w-36 rounded-full bg-gold-400/10 blur-[60px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="font-display text-sm italic tracking-widest text-gold-400 uppercase">
            Testimonials
          </p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight text-white sm:text-4xl">
            What our clients say
          </h2>
        </div>

        <div className="relative">
          {/* Carousel Container */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {topTestimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                  <Card className="mx-auto max-w-2xl border-0 bg-white/[0.07] backdrop-blur-md shadow-2xl">
                    <CardContent className="p-6 md:p-10">
                      <div className="mb-6">
                        <Quote className="h-10 w-10 text-gold-400/40" />
                      </div>
                      
                      <blockquote className="mb-8 font-serif text-xl leading-relaxed text-warm-100 sm:text-2xl">
                        &ldquo;{testimonial.comment}&rdquo;
                      </blockquote>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-400/20 bg-burgundy-600/30 text-sm font-bold text-gold-300">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-warm-100">
                              {testimonial.profiles?.full_name || "Client"}
                            </p>
                            <p className="text-sm text-warm-400">
                              {testimonial.services?.name}
                              {testimonial.services?.categories?.name &&
                                ` · ${testimonial.services.categories.name}`}
                            </p>
                          </div>
                        </div>
                        
                        <StarRating
                          rating={testimonial.rating}
                          readonly
                          size="sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          {topTestimonials.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 rounded-full border-warm-600/30 bg-white/10 backdrop-blur-sm text-warm-200 hover:bg-white/20 hover:border-gold-400/30 shadow-lg"
                onClick={goToPrevious}
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 rounded-full border-warm-600/30 bg-white/10 backdrop-blur-sm text-warm-200 hover:bg-white/20 hover:border-gold-400/30 shadow-lg"
                onClick={goToNext}
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Dots Indicator */}
        {topTestimonials.length > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {topTestimonials.map((_, index) => (
              <button
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 bg-gold-400"
                    : "w-1.5 bg-warm-500/40 hover:bg-warm-400/60"
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Link to all testimonials */}
        <div className="mt-10 text-center">
          <Button
            variant="outline"
            className="rounded-full border-warm-500/30 text-warm-200 hover:bg-white/5 hover:border-gold-400/30 hover:text-white transition-all"
            onClick={() => window.location.href = "/depoimentos"}
          >
            View all testimonials
          </Button>
        </div>
      </div>
    </section>
  );
}
