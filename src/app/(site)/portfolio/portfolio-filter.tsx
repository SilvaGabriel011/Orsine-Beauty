"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category_id: string | null;
  categories: { id: string; name: string; slug: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function PortfolioFilter({
  items,
  categories,
}: {
  items: PortfolioItem[];
  categories: Category[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    null
  );
  const [lightbox, setLightbox] = useState<PortfolioItem | null>(null);

  const filtered = selectedCategory
    ? items.filter((i) => i.category_id === selectedCategory)
    : items;

  return (
    <>
      {/* Category Filter */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className={
            selectedCategory === null
              ? "bg-rose-600 text-white hover:bg-rose-700"
              : ""
          }
        >
          Todos
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className={
              selectedCategory === cat.id
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : ""
            }
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          Nenhuma foto encontrada.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group cursor-pointer overflow-hidden rounded-xl"
              onClick={() => setLightbox(item)}
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="font-semibold">{item.title}</p>
                  {item.categories?.name && (
                    <p className="text-sm text-white/80">
                      {item.categories.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog
        open={!!lightbox}
        onOpenChange={(open) => {
          if (!open) setLightbox(null);
        }}
      >
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {lightbox?.title || "Foto do portfolio"}
          </DialogTitle>
          {lightbox && (
            <>
              <div className="relative aspect-square max-h-[70vh] w-full">
                <Image
                  src={lightbox.image_url}
                  alt={lightbox.title}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold">{lightbox.title}</h3>
                {lightbox.categories?.name && (
                  <p className="text-sm text-muted-foreground">
                    {lightbox.categories.name}
                  </p>
                )}
                {lightbox.description && (
                  <p className="mt-2 text-sm text-gray-600">
                    {lightbox.description}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
