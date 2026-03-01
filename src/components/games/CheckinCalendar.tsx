/**
 * Componente: Calendario de Check-in Diario
 *
 * Exibe um calendario de 7 dias com recompensas progressivas de moedas.
 * O cliente pode fazer check-in uma vez por dia para ganhar moedas.
 * A cada 7 dias consecutivos, ganha um bonus especial.
 *
 * Props:
 * - currentStreak: Numero de dias consecutivos de check-in
 * - lastCheckinDate: Data do ultimo check-in (null se nenhum)
 * - alreadyCheckedIn: Se o cliente ja fez check-in hoje
 * - onCheckinSuccess: Callback com resultado do check-in
 */
"use client";

import { useState } from "react";
import { Check, Flame, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CheckinCalendarProps {
  currentStreak: number;
  lastCheckinDate: string | null;
  alreadyCheckedIn: boolean;
  onCheckinSuccess: (result: {
    coins_earned: number;
    streak: number;
    bonus: number;
  }) => void;
}

// Recompensas por dia do ciclo de 7 dias
const STREAK_REWARDS = [
  { day: 1, coins: 5 },
  { day: 2, coins: 7 },
  { day: 3, coins: 9 },
  { day: 4, coins: 11 },
  { day: 5, coins: 13 },
  { day: 6, coins: 15 },
  { day: 7, coins: 55 },
];

export function CheckinCalendar({
  currentStreak,
  lastCheckinDate,
  alreadyCheckedIn,
  onCheckinSuccess,
}: CheckinCalendarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(alreadyCheckedIn);

  // Calcula qual dia do ciclo de 7 dias o cliente esta
  const streakDay = checkedIn ? currentStreak : currentStreak + 1;
  const cycleDay = ((streakDay - 1) % 7) + 1;

  const handleCheckin = async () => {
    if (checkedIn || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/games/checkin", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || "Erro ao fazer check-in");
        return;
      }

      setCheckedIn(true);
      onCheckinSuccess(data);
      toast.success(`+${data.coins_earned} moedas! Dia ${data.streak} de streak`);
    } catch {
      toast.error("Erro de conexao. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Determina quantos dias foram completados no ciclo atual de 7 dias
  const completedDays = checkedIn ? cycleDay : cycleDay - 1;

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      {/* Header com titulo e indicador de dias de streak */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Check-in Diario</h3>
        {currentStreak > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-600">
            <Flame className="h-4 w-4" />
            {currentStreak} dias
          </div>
        )}
      </div>

      {/* Grid de 7 dias com recompensas */}
      <div className="mb-5 grid grid-cols-7 gap-2">
        {STREAK_REWARDS.map((reward, index) => {
          const dayNum = index + 1;
          const isCompleted = dayNum <= completedDays;
          const isCurrent = dayNum === completedDays + 1 && !checkedIn;
          const isBonus = dayNum === 7; // Dia 7 tem bonus especial

          return (
            <div
              key={dayNum}
              className={`relative flex flex-col items-center rounded-xl border-2 p-2 transition-all ${
                isCompleted
                  ? "border-amber-400 bg-amber-50"
                  : isCurrent
                    ? "border-rose-400 bg-rose-50 ring-2 ring-rose-200"
                    : "border-gray-200 bg-gray-50"
              }`}
            >
              <span className="text-[10px] font-medium text-gray-500">Dia {dayNum}</span>
              {/* Icone ou numero de moedas */}
              <div
                className={`my-1 flex h-8 w-8 items-center justify-center rounded-full ${
                  isCompleted
                    ? "bg-amber-400 text-white"
                    : isBonus
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                      : "bg-gray-200 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : isBonus ? (
                  <Gift className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-bold">{reward.coins}</span>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold ${
                  isCompleted ? "text-amber-600" : "text-gray-400"
                }`}
              >
                +{reward.coins}
              </span>
            </div>
          );
        })}
      </div>

      {/* Botao para fazer check-in */}
      <Button
        onClick={handleCheckin}
        disabled={checkedIn || isLoading}
        className={`w-full text-base font-semibold ${
          checkedIn
            ? "bg-gray-200 text-gray-500"
            : "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-200"
        }`}
        size="lg"
      >
        {isLoading ? (
          <span className="animate-pulse">Registrando...</span>
        ) : checkedIn ? (
          <span className="flex items-center gap-2">
            <Check className="h-5 w-5" />
            Check-in feito! Volte amanha
          </span>
        ) : (
          "Fazer Check-in"
        )}
      </Button>
    </div>
  );
}
