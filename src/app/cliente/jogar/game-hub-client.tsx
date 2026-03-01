"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Disc3,
  Sparkles,
  HelpCircle,
  Smartphone,
  Flame,
  Trophy,
  ShoppingBag,
  Crown,
  Store,
} from "lucide-react";
import { CoinBalance } from "@/components/games/CoinBalance";
import { CheckinCalendar } from "@/components/games/CheckinCalendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GameHubProps {
  initialCoins: number;
  initialStreak: number;
  longestStreak: number;
  lastCheckinDate: string | null;
  playedToday: Record<string, boolean>;
}

interface GameCard {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  bgColor: string;
}

const GAMES: GameCard[] = [
  {
    id: "wheel",
    name: "Roleta da Sorte",
    description: "Gire e ganhe moedas!",
    icon: <Disc3 className="h-7 w-7" />,
    href: "/cliente/jogar/roleta",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
  },
  {
    id: "scratch",
    name: "Raspadinha",
    description: "Raspe e descubra seu premio",
    icon: <Sparkles className="h-7 w-7" />,
    href: "/cliente/jogar/raspadinha",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    id: "quiz",
    name: "Quiz Beleza",
    description: "Teste seus conhecimentos",
    icon: <HelpCircle className="h-7 w-7" />,
    href: "/cliente/jogar/quiz",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: "shake",
    name: "Shake",
    description: "Chacoalhe e ganhe moedas",
    icon: <Smartphone className="h-7 w-7" />,
    href: "/cliente/jogar/shake",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
];

export function GameHub({
  initialCoins,
  initialStreak,
  longestStreak,
  lastCheckinDate,
  playedToday,
}: GameHubProps) {
  const [coins, setCoins] = useState(initialCoins);
  const [streak, setStreak] = useState(initialStreak);
  const [played, setPlayed] = useState(playedToday);

  const handleCheckinSuccess = (result: {
    coins_earned: number;
    streak: number;
  }) => {
    setCoins((prev) => prev + result.coins_earned);
    setStreak(result.streak);
    setPlayed((prev) => ({ ...prev, checkin: true }));
  };

  const allPlayedToday = Object.values(played).every(Boolean);

  return (
    <div className="space-y-6">
      {/* Header with coin balance */}
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border border-amber-200 p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Minigames Diarios</h1>
        <p className="text-sm text-gray-500">
          Jogue todo dia e acumule moedas para trocar por recompensas!
        </p>
        <CoinBalance coins={coins} size="lg" />
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Flame className="h-4 w-4 text-orange-500" />
            Streak: {streak} dias
          </span>
          <span className="flex items-center gap-1">
            <Trophy className="h-4 w-4 text-amber-500" />
            Recorde: {Math.max(longestStreak, streak)} dias
          </span>
        </div>
        {allPlayedToday && (
          <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
            Todos os jogos feitos hoje!
          </Badge>
        )}
      </div>

      {/* Check-in calendar */}
      <CheckinCalendar
        currentStreak={streak}
        lastCheckinDate={lastCheckinDate}
        alreadyCheckedIn={played.checkin}
        onCheckinSuccess={handleCheckinSuccess}
      />

      {/* Minigames grid */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Minigames</h2>
        <div className="grid grid-cols-2 gap-3">
          {GAMES.map((game) => {
            const hasPlayed = played[game.id];

            return (
              <Link key={game.id} href={game.href}>
                <Card
                  className={`relative cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
                    hasPlayed ? "opacity-60" : ""
                  }`}
                >
                  <CardContent className="flex flex-col items-center p-4 text-center">
                    <div
                      className={`mb-2 flex h-14 w-14 items-center justify-center rounded-xl ${game.bgColor} ${game.color}`}
                    >
                      {game.icon}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{game.name}</h3>
                    <p className="mt-0.5 text-xs text-gray-500">{game.description}</p>
                    {hasPlayed ? (
                      <Badge variant="secondary" className="mt-2 text-[10px]">
                        Jogou hoje
                      </Badge>
                    ) : (
                      <Badge className="mt-2 bg-rose-500 text-[10px] text-white hover:bg-rose-600">
                        Disponivel
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/cliente/loja">
          <Card className="cursor-pointer transition-all hover:shadow-md">
            <CardContent className="flex flex-col items-center p-3 text-center">
              <Store className="mb-1 h-5 w-5 text-amber-600" />
              <span className="text-xs font-medium text-gray-700">Loja</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/cliente/conquistas">
          <Card className="cursor-pointer transition-all hover:shadow-md">
            <CardContent className="flex flex-col items-center p-3 text-center">
              <Crown className="mb-1 h-5 w-5 text-purple-600" />
              <span className="text-xs font-medium text-gray-700">Conquistas</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/cliente/ranking">
          <Card className="cursor-pointer transition-all hover:shadow-md">
            <CardContent className="flex flex-col items-center p-3 text-center">
              <ShoppingBag className="mb-1 h-5 w-5 text-blue-600" />
              <span className="text-xs font-medium text-gray-700">Ranking</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
