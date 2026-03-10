/**
 * Componente: Classificacao com Estrelas
 *
 * Componente de avaliacao com 5 estrelas. Pode ser somente leitura
 * (para exibir avaliacoes) ou interativo (para que usuario vote).
 * Suporta 3 tamanhos diferentes.
 *
 * Props:
 * - rating: Valor da avaliacao (1-5)
 * - onChange: Callback quando usuario seleciona uma estrela (opcional)
 * - size: Tamanho das estrelas ("sm" | "md" | "lg")
 * - readonly: Se true, nao permite interacao
 * - className: Classes CSS customizadas
 */
"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  className?: string;
}

// Tamanhos de icones para cada variacao
const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export default function StarRating({
  rating,
  onChange,
  size = "md",
  readonly = false,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  // Se for input, permite interacao; caso contrario, somente leitura
  const isInput = !readonly && !!onChange;
  // Exibe a avaliacao do hover ou a avaliacao corrente
  const displayRating = isInput && hoverRating > 0 ? hoverRating : rating;

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      onMouseLeave={() => isInput && setHoverRating(0)}
    >
      {/* Renderiza 5 estrelas, preenchidas conforme a avaliacao */}
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={cn(
            "transition-colors",
            isInput && "cursor-pointer hover:scale-110 transition-transform"
          )}
          onClick={() => isInput && onChange(star)}
          onMouseEnter={() => isInput && setHoverRating(star)}
        >
          {/* Estrela preenchida ou vazia baseado na avaliacao */}
          <Star
            className={cn(
              sizeMap[size],
              star <= displayRating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}
