"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart-context";
import CategoryCarousel from "@/components/marketplace/CategoryCarousel";
import MarketplaceServiceCard from "@/components/marketplace/MarketplaceServiceCard";
import FloatingCartBar from "@/components/marketplace/FloatingCartBar";
import type { Category, Service } from "@/types/database";

interface MarketplaceClientProps {
  categories: Category[];
  services: (Service & { categories?: { id: string; name: string; slug: string } })[];
}

export default function MarketplaceClient({
  categories,
  services,
}: MarketplaceClientProps) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");

  // Find initial category ID from slug
  const initialCategoryId = initialCategory
    ? categories.find((c) => c.slug === initialCategory)?.id ?? null
    : null;

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialCategoryId
  );
  const [searchQuery, setSearchQuery] = useState("");
  const { addItem, removeItem, isInCart } = useCart();

  // Filter services
  const filteredServices = useMemo(() => {
    let result = services;

    // Filter by category
    if (selectedCategoryId) {
      result = result.filter(
        (s) => s.category_id === selectedCategoryId
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.categories?.name.toLowerCase().includes(query)
      );
    }

    return result;
  }, [services, selectedCategoryId, searchQuery]);

  // Group by category for display when "Todos" is selected
  const selectedCategoryName = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)?.name
    : null;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-warm-100 to-cream pb-2 pt-24 sm:pt-28">
        <div className="mx-auto max-w-7xl px-4">
          <p className="font-display text-sm italic tracking-widest text-gold-500 uppercase">
            Our services
          </p>
          <h1 className="mt-2 font-serif text-3xl tracking-tight text-warm-900 sm:text-4xl">
            Book Services
          </h1>
          <p className="mt-2 text-sm text-warm-500">
            Choose your services and add them to your cart
          </p>

          {/* Search bar */}
          <div className="relative mt-5">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl bg-white border-warm-200 focus:border-burgundy-300 focus:ring-burgundy-200/30"
            />
          </div>
        </div>
      </div>

      {/* Category Carousel (sticky) */}
      <div className="sticky top-18 z-30 border-b border-warm-200/50 bg-cream/95 px-4 py-2.5 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl">
          <CategoryCarousel
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {selectedCategoryName && (
          <h2 className="mb-5 font-serif text-xl text-warm-900">
            {selectedCategoryName}
          </h2>
        )}

        {filteredServices.length === 0 ? (
          <div className="py-16 text-center">
            <Search className="mx-auto mb-3 h-12 w-12 text-warm-300" />
            <h3 className="font-serif text-lg text-warm-600">
              No services found
            </h3>
            <p className="mt-1 text-sm text-warm-400">
              Try another category or search term
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredServices.map((service) => (
              <MarketplaceServiceCard
                key={service.id}
                service={service}
                isInCart={isInCart(service.id)}
                onAdd={() => addItem(service)}
                onRemove={() => removeItem(service.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Bar */}
      <FloatingCartBar />
    </div>
  );
}
