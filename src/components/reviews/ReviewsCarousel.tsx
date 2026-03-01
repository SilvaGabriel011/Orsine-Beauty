/**
 * Componente: Carrossel de Avaliacoes (Reviews Carousel)
 *
 * Lista horizontal scrollavel de avaliacoes de clientes.
 * Cada card exibe: avatar do cliente, nome, servico avaliado,
 * classificacao em estrelas e comentario.
 *
 * Props:
 * - reviews: Array de objetos de avaliacao com dados de cliente e servico
 *
 * Comportamento: Nao exibe se nao houver avaliacoes
 */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import StarRating from "./StarRating";

interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
  services: { name: string } | null;
}

export default function ReviewsCarousel({
  reviews,
}: {
  reviews: ReviewData[];
}) {
  // Nao exibe nada se nao houver avaliacoes
  if (reviews.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {/* Card para cada avaliacao */}
      {reviews.map((review) => (
        <Card
          key={review.id}
          className="min-w-[280px] max-w-[320px] shrink-0"
        >
          <CardContent className="p-5">
            {/* Header: Avatar, nome e servico */}
            <div className="mb-3 flex items-center gap-2">
              {/* Avatar com iniciais do cliente */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600">
                {review.profiles?.full_name
                  ? review.profiles.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "?"}
              </div>
              <div>
                {/* Nome do cliente e servico avaliado */}
                <p className="text-sm font-medium">
                  {review.profiles?.full_name || "Cliente"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {review.services?.name}
                </p>
              </div>
            </div>
            {/* Classificacao em estrelas */}
            <StarRating rating={review.rating} readonly size="sm" />
            {/* Comentario da avaliacao (truncado a 3 linhas) */}
            {review.comment && (
              <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                &ldquo;{review.comment}&rdquo;
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
