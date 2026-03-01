"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CoinBalance } from "./CoinBalance";
import { toast } from "sonner";

interface WheelSegment {
  label: string;
  coins: number;
  color: string;
}

interface SpinWheelProps {
  segments: WheelSegment[];
  disabled?: boolean;
  currentCoins: number;
  onResult: (coins: number) => void;
}

export function SpinWheel({ segments, disabled = false, currentCoins, onResult }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(disabled);
  const [resultText, setResultText] = useState<string | null>(null);

  const segmentAngle = 360 / segments.length;

  const handleSpin = useCallback(async () => {
    if (isSpinning || hasPlayed) return;

    setIsSpinning(true);
    setResultText(null);

    try {
      const res = await fetch("/api/games/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "wheel" }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || "Erro ao girar a roleta");
        setIsSpinning(false);
        return;
      }

      const winIndex = data.result.segment_index as number;
      const coinsWon = data.coins_earned as number;

      // Calculate rotation to land on winning segment
      // Segments are drawn clockwise from top. The pointer is at the top.
      // We need to rotate so that the winning segment ends up at the top.
      const targetAngle = 360 - winIndex * segmentAngle - segmentAngle / 2;
      const fullSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
      const totalRotation = rotation + fullSpins * 360 + targetAngle;

      setRotation(totalRotation);

      // Wait for animation to finish
      setTimeout(() => {
        setIsSpinning(false);
        setHasPlayed(true);
        setResultText(coinsWon > 0 ? `+${coinsWon} moedas!` : "Tente amanha!");
        onResult(coinsWon);

        if (coinsWon > 0) {
          toast.success(`Voce ganhou ${coinsWon} moedas na roleta!`);
        } else {
          toast.info("Nao foi dessa vez. Volte amanha!");
        }
      }, 4500);
    } catch {
      toast.error("Erro de conexao. Tente novamente.");
      setIsSpinning(false);
    }
  }, [isSpinning, hasPlayed, rotation, segmentAngle, onResult]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Coin balance */}
      <CoinBalance coins={currentCoins} size="lg" />

      {/* Wheel container */}
      <div className="relative">
        {/* Pointer at top */}
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
          <div className="h-0 w-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-gray-800" />
        </div>

        {/* Wheel */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{
            duration: 4.5,
            ease: [0.2, 0.8, 0.3, 1],
          }}
          className="h-72 w-72 rounded-full border-4 border-gray-800 shadow-2xl sm:h-80 sm:w-80"
          style={{
            background: generateConicGradient(segments),
          }}
        >
          {/* Segment labels */}
          {segments.map((segment, index) => {
            const angle = index * segmentAngle + segmentAngle / 2;
            return (
              <div
                key={index}
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: `rotate(${angle}deg)`,
                }}
              >
                <span
                  className="absolute text-[10px] font-bold text-white drop-shadow-md sm:text-xs"
                  style={{
                    top: "18%",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                  }}
                >
                  {segment.label}
                </span>
              </div>
            );
          })}

          {/* Center circle */}
          <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-gray-800 bg-white shadow-inner">
            <span className="text-xl font-bold text-gray-800">GO</span>
          </div>
        </motion.div>
      </div>

      {/* Result */}
      {resultText && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-2xl font-bold text-amber-600"
        >
          {resultText}
        </motion.div>
      )}

      {/* Spin button */}
      <Button
        onClick={handleSpin}
        disabled={isSpinning || hasPlayed}
        size="lg"
        className={`w-full max-w-xs text-lg font-bold ${
          hasPlayed
            ? "bg-gray-200 text-gray-500"
            : "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-200 hover:from-rose-600 hover:to-pink-600"
        }`}
      >
        {isSpinning ? "Girando..." : hasPlayed ? "Volte amanha!" : "Girar Roleta"}
      </Button>
    </div>
  );
}

function generateConicGradient(segments: WheelSegment[]): string {
  const segAngle = 360 / segments.length;
  const stops: string[] = [];

  segments.forEach((segment, i) => {
    const start = i * segAngle;
    const end = (i + 1) * segAngle;
    stops.push(`${segment.color} ${start}deg ${end}deg`);
  });

  return `conic-gradient(from 0deg, ${stops.join(", ")})`;
}
