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
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-rose-50 to-gray-50/50 pb-2 pt-8">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Agendar servicos
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Escolha os servicos e adicione ao carrinho
          </p>

          {/* Search bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar servicos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200 focus:border-rose-300 focus:ring-rose-200"
            />
          </div>
        </div>
      </div>

      {/* Category Carousel (sticky) */}
      <div className="sticky top-16 z-30 border-b border-gray-100 bg-gray-50/95 px-4 py-2 backdrop-blur-md">
        <div className="mx-auto max-w-7xl">
          <CategoryCarousel
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {selectedCategoryName && (
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {selectedCategoryName}
          </h2>
        )}

        {filteredServices.length === 0 ? (
          <div className="py-16 text-center">
            <Search className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-600">
              Nenhum servico encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Tente outra categoria ou busca
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
