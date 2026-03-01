"use client";

import { Coins } from "lucide-react";

interface CoinBalanceProps {
  coins: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CoinBalance({ coins, size = "md", className = "" }: CoinBalanceProps) {
  const sizes = {
    sm: "text-sm px-2.5 py-0.5",
    md: "text-base px-3 py-1",
    lg: "text-2xl px-4 py-2 font-bold",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-6 w-6",
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 font-semibold ${sizes[size]} ${className}`}
    >
      <Coins className={iconSizes[size]} />
      <span>{coins.toLocaleString("pt-BR")}</span>
    </div>
  );
}
