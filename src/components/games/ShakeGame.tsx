"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CoinBalance } from "./CoinBalance";
import { toast } from "sonner";
import { Smartphone, Coins } from "lucide-react";

interface ShakeGameProps {
  disabled?: boolean;
  currentCoins: number;
  onResult: (coins: number) => void;
}

const SHAKE_THRESHOLD = 15;
const REQUIRED_SHAKES = 5;
const CLICK_REQUIRED = 10;

export function ShakeGame({ disabled = false, currentCoins, onResult }: ShakeGameProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(disabled);
  const [shakeCount, setShakeCount] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultCoins, setResultCoins] = useState<number | null>(null);
  const [hasMotion, setHasMotion] = useState(false);
  const [fallingCoins, setFallingCoins] = useState<number[]>([]);
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });

  // Check for device motion support
  useEffect(() => {
    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      setHasMotion(true);
    }
  }, []);

  // Device motion handler
  useEffect(() => {
    if (!isPlaying || !hasMotion || hasPlayed) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const accel = event.accelerationIncludingGravity;
      if (!accel) return;

      const deltaX = Math.abs((accel.x || 0) - lastAccel.current.x);
      const deltaY = Math.abs((accel.y || 0) - lastAccel.current.y);
      const deltaZ = Math.abs((accel.z || 0) - lastAccel.current.z);

      lastAccel.current = {
        x: accel.x || 0,
        y: accel.y || 0,
        z: accel.z || 0,
      };

      if (deltaX + deltaY + deltaZ > SHAKE_THRESHOLD) {
        setShakeCount((prev) => {
          const next = prev + 1;
          if (next >= REQUIRED_SHAKES) {
            submitPlay();
          }
          return next;
        });
        // Add a falling coin animation
        setFallingCoins((prev) => [...prev, Date.now()]);
      }
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [isPlaying, hasMotion, hasPlayed]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick = useCallback(() => {
    if (!isPlaying || hasPlayed || isSubmitting) return;

    setClickCount((prev) => {
      const next = prev + 1;
      // Add falling coin
      setFallingCoins((p) => [...p, Date.now()]);

      if (next >= CLICK_REQUIRED) {
        submitPlay();
      }
      return next;
    });
  }, [isPlaying, hasPlayed, isSubmitting]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitPlay = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/games/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "shake" }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || "Erro ao registrar jogada");
        return;
      }

      const coins = data.coins_earned as number;
      setResultCoins(coins);
      setHasPlayed(true);
      setIsPlaying(false);
      onResult(coins);

      toast.success(`Voce ganhou ${coins} moedas!`);
    } catch {
      toast.error("Erro de conexao.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startGame = () => {
    if (hasPlayed) return;
    setIsPlaying(true);
    setShakeCount(0);
    setClickCount(0);
    setFallingCoins([]);

    // Request permission for device motion on iOS
    if (
      hasMotion &&
      typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === "function"
    ) {
      (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> })
        .requestPermission()
        .catch(() => {
          // Fallback to click mode
          setHasMotion(false);
        });
    }
  };

  const progress = hasMotion
    ? Math.min(shakeCount / REQUIRED_SHAKES, 1)
    : Math.min(clickCount / CLICK_REQUIRED, 1);

  return (
    <div className="flex flex-col items-center gap-6">
      <CoinBalance coins={currentCoins} size="lg" />

      {!isPlaying && resultCoins === null && !hasPlayed ? (
        /* Start screen */
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-dashed border-emerald-300">
            <div className="text-center">
              <span className="text-4xl">📱</span>
              <p className="mt-2 text-sm font-medium text-emerald-600">Shake</p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500">
            {hasMotion
              ? "Chacoalhe o celular para derrubar moedas!"
              : "Clique rapidamente para derrubar moedas!"}
          </p>

          <Button
            onClick={startGame}
            size="lg"
            className="w-full max-w-xs text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-teal-600"
          >
            Comecar!
          </Button>
        </div>
      ) : isPlaying ? (
        /* Playing screen */
        <div className="relative flex flex-col items-center gap-4">
          {/* Falling coins animation */}
          <div className="relative h-48 w-48 overflow-hidden">
            <AnimatePresence>
              {fallingCoins.slice(-8).map((key) => (
                <motion.div
                  key={key}
                  initial={{
                    y: -20,
                    x: Math.random() * 160 - 80,
                    opacity: 1,
                    scale: 1,
                  }}
                  animate={{
                    y: 200,
                    opacity: 0,
                    rotate: Math.random() * 360,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: "easeIn" }}
                  className="absolute left-1/2 text-amber-500"
                >
                  <Coins className="h-6 w-6" />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Phone icon */}
            <motion.div
              animate={isPlaying ? { rotate: [-5, 5, -5] } : {}}
              transition={{ repeat: Infinity, duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center"
              onClick={!hasMotion ? handleClick : undefined}
            >
              <div className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 shadow-lg">
                <Smartphone className="h-12 w-12 text-white" />
              </div>
            </motion.div>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-xs">
            <div className="mb-1 flex justify-between text-xs text-gray-500">
              <span>{hasMotion ? "Chacoalhe!" : "Clique!"}</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>

          {!hasMotion && (
            <Button
              onClick={handleClick}
              size="lg"
              className="w-full max-w-xs bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition-transform"
            >
              Tap! Tap! Tap! ({clickCount}/{CLICK_REQUIRED})
            </Button>
          )}
        </div>
      ) : hasPlayed && resultCoins === null ? (
        <p className="text-lg text-gray-500">Voce ja jogou hoje. Volte amanha!</p>
      ) : null}

      {/* Result */}
      {resultCoins !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-4xl">🎉</span>
          <p className="text-2xl font-bold text-amber-600">+{resultCoins} moedas!</p>
          <p className="text-sm text-gray-500">Volte amanha para jogar novamente!</p>
        </motion.div>
      )}
    </div>
  );
}
