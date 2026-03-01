"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CoinBalance } from "./CoinBalance";
import { toast } from "sonner";
import { Star, Heart, Diamond, Flower2, Crown } from "lucide-react";

const SYMBOL_ICONS: Record<string, React.ReactNode> = {
  star: <Star className="h-6 w-6" />,
  heart: <Heart className="h-6 w-6" />,
  diamond: <Diamond className="h-6 w-6" />,
  flower: <Flower2 className="h-6 w-6" />,
  crown: <Crown className="h-6 w-6" />,
};

const SYMBOL_COLORS: Record<string, string> = {
  star: "text-amber-500",
  heart: "text-rose-500",
  diamond: "text-blue-500",
  flower: "text-pink-500",
  crown: "text-purple-500",
};

interface ScratchCardProps {
  disabled?: boolean;
  currentCoins: number;
  onResult: (coins: number) => void;
}

export function ScratchCard({ disabled = false, currentCoins, onResult }: ScratchCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(disabled);
  const [gameResult, setGameResult] = useState<{
    grid: string[][];
    coins: number;
    label: string;
  } | null>(null);
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [allRevealed, setAllRevealed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const startGame = useCallback(async () => {
    if (isLoading || hasPlayed) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/games/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "scratch" }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || "Erro ao iniciar raspadinha");
        setIsLoading(false);
        return;
      }

      setGameResult({
        grid: data.result.grid as string[][],
        coins: data.coins_earned as number,
        label: data.result.prize_label as string,
      });
    } catch {
      toast.error("Erro de conexao. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasPlayed]);

  const revealCell = useCallback(
    (row: number, col: number) => {
      if (!gameResult || allRevealed) return;

      const key = `${row}-${col}`;
      setRevealedCells((prev) => {
        const next = new Set(prev);
        next.add(key);

        // Check if all revealed
        if (next.size >= 9) {
          setAllRevealed(true);
          setHasPlayed(true);
          onResult(gameResult.coins);

          if (gameResult.coins > 0) {
            toast.success(`${gameResult.label} Voce ganhou ${gameResult.coins} moedas!`);
          } else {
            toast.info("Nao foi dessa vez. Volte amanha!");
          }
        }

        return next;
      });
    },
    [gameResult, allRevealed, onResult]
  );

  // Allow revealing all at once
  const revealAll = useCallback(() => {
    if (!gameResult) return;

    const all = new Set<string>();
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        all.add(`${r}-${c}`);
      }
    }
    setRevealedCells(all);
    setAllRevealed(true);
    setHasPlayed(true);
    onResult(gameResult.coins);

    if (gameResult.coins > 0) {
      toast.success(`${gameResult.label} Voce ganhou ${gameResult.coins} moedas!`);
    } else {
      toast.info("Nao foi dessa vez. Volte amanha!");
    }
  }, [gameResult, onResult]);

  return (
    <div className="flex flex-col items-center gap-6">
      <CoinBalance coins={currentCoins} size="lg" />

      {!gameResult ? (
        /* Start screen */
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-dashed border-purple-300">
            <div className="text-center">
              <span className="text-4xl">🎫</span>
              <p className="mt-2 text-sm font-medium text-purple-600">Raspadinha</p>
            </div>
          </div>

          <Button
            onClick={startGame}
            disabled={isLoading || hasPlayed}
            size="lg"
            className={`w-full max-w-xs text-lg font-bold ${
              hasPlayed
                ? "bg-gray-200 text-gray-500"
                : "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200 hover:from-purple-600 hover:to-pink-600"
            }`}
          >
            {isLoading ? "Preparando..." : hasPlayed ? "Volte amanha!" : "Raspar!"}
          </Button>
        </div>
      ) : (
        /* Game grid */
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-gray-500">Toque nas celulas para revelar os simbolos!</p>

          <div className="grid grid-cols-3 gap-2">
            {gameResult.grid.map((row, rowIdx) =>
              row.map((symbol, colIdx) => {
                const key = `${rowIdx}-${colIdx}`;
                const isRevealed = revealedCells.has(key);

                return (
                  <motion.button
                    key={key}
                    onClick={() => revealCell(rowIdx, colIdx)}
                    whileTap={!isRevealed ? { scale: 0.95 } : {}}
                    className={`relative flex h-20 w-20 items-center justify-center rounded-xl border-2 transition-all sm:h-24 sm:w-24 ${
                      isRevealed
                        ? "border-purple-200 bg-white"
                        : "cursor-pointer border-purple-400 bg-gradient-to-br from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {isRevealed ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className={`flex flex-col items-center ${SYMBOL_COLORS[symbol] || "text-gray-500"}`}
                        >
                          {SYMBOL_ICONS[symbol] || <Star className="h-6 w-6" />}
                          <span className="mt-0.5 text-[10px] font-medium capitalize">{symbol}</span>
                        </motion.div>
                      ) : (
                        <motion.span
                          exit={{ scale: 0 }}
                          className="text-2xl font-bold text-white"
                        >
                          ?
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })
            )}
          </div>

          {!allRevealed && (
            <Button
              variant="outline"
              size="sm"
              onClick={revealAll}
              className="text-xs"
            >
              Revelar tudo
            </Button>
          )}

          {allRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className="text-xl font-bold text-purple-600">{gameResult.label}</p>
              {gameResult.coins > 0 && (
                <p className="text-lg font-semibold text-amber-600">+{gameResult.coins} moedas!</p>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
