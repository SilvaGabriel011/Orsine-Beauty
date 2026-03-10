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
              O que nossas clientes dizem
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
    <section className="py-12 bg-gradient-to-br from-pink-50 to-rose-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            O que nossas clientes dizem
          </h2>
          <p className="mt-2 text-gray-600">
            Avaliações reais de quem já experimentou nossos serviços
          </p>
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
                  <Card className="mx-auto max-w-2xl border-0 shadow-lg">
                    <CardContent className="p-6 md:p-8">
                      <div className="mb-4">
                        <Quote className="h-8 w-8 text-rose-200" />
                      </div>
                      
                      <blockquote className="mb-6 text-lg leading-relaxed text-gray-700">
                        &ldquo;{testimonial.comment}&rdquo;
                      </blockquote>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {testimonial.profiles?.full_name || "Cliente"}
                            </p>
                            <p className="text-sm text-gray-600">
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
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 rounded-full bg-white shadow-md"
                onClick={goToPrevious}
                aria-label="Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 rounded-full bg-white shadow-md"
                onClick={goToNext}
                aria-label="Próximo"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Dots Indicator */}
        {topTestimonials.length > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {topTestimonials.map((_, index) => (
              <button
                key={index}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-8 bg-rose-600"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Ir para depoimento ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Link to all testimonials */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            className="border-rose-600 text-rose-600 hover:bg-rose-50"
            onClick={() => window.location.href = "/depoimentos"}
          >
            Ver todos os depoimentos
          </Button>
        </div>
      </div>
    </section>
  );
}
