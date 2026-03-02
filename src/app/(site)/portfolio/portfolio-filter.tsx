"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { BLUR_ROSE } from "@/lib/image-blur";

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
      <div className="mb-10 flex flex-wrap justify-center gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className={
            selectedCategory === null
              ? "rounded-full bg-burgundy-600 text-white hover:bg-burgundy-700"
              : "rounded-full border-warm-300 text-warm-600 hover:bg-warm-200/50 hover:text-burgundy-700"
          }
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className={
              selectedCategory === cat.id
                ? "rounded-full bg-burgundy-600 text-white hover:bg-burgundy-700"
                : "rounded-full border-warm-300 text-warm-600 hover:bg-warm-200/50 hover:text-burgundy-700"
            }
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-warm-400">
          No photos found.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group cursor-pointer overflow-hidden rounded-2xl"
              onClick={() => setLightbox(item)}
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-warm-100">
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  placeholder="blur"
                  blurDataURL={BLUR_ROSE}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-burgundy-900/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <p className="font-serif text-lg">{item.title}</p>
                  {item.categories?.name && (
                    <p className="text-sm text-warm-200">
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
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-warm-200">
          <DialogTitle className="sr-only">
            {lightbox?.title || "Portfolio photo"}
          </DialogTitle>
          {lightbox && (
            <>
              <div className="relative aspect-square max-h-[70vh] w-full bg-warm-100">
                <Image
                  src={lightbox.image_url}
                  alt={lightbox.title}
                  fill
                  className="object-contain"
                  placeholder="blur"
                  blurDataURL={BLUR_ROSE}
                />
              </div>
              <div className="p-5">
                <h3 className="font-serif text-lg text-warm-900">{lightbox.title}</h3>
                {lightbox.categories?.name && (
                  <p className="text-sm text-warm-500">
                    {lightbox.categories.name}
                  </p>
                )}
                {lightbox.description && (
                  <p className="mt-2 text-sm text-warm-600">
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
