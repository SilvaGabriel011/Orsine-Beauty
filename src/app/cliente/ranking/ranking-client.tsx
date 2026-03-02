"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, Medal, Trophy, Loader2, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";

interface RankingEntry {
  position: number;
  client_id: string;
  name: string;
  coins_earned: number;
  is_current_user: boolean;
}

interface RankingData {
  rankings: RankingEntry[];
  user_position: { position: number; coins_earned: number } | null;
  period: string;
}

const POSITION_ICONS = [
  <Crown key="1" className="h-5 w-5 text-amber-500" />,
  <Medal key="2" className="h-5 w-5 text-gray-400" />,
  <Medal key="3" className="h-5 w-5 text-amber-700" />,
];

interface RankingClientProps {
  userId: string;
}

export function RankingClient({ userId }: RankingClientProps) {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [data, setData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRanking() {
      setLoading(true);
      try {
        const res = await fetch(`/api/games/ranking?period=${period}`);
        const result = await res.json();
        setData(result);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchRanking();
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/cliente/jogar"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Games
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Ranking</h1>
      </div>

      {/* Period selector */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as "weekly" | "monthly")}>
        <TabsList className="w-full">
          <TabsTrigger value="weekly" className="flex-1">
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1">
            Monthly
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* User's position */}
      {data?.user_position && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-500">Your position</p>
              <p className="text-2xl font-bold text-gray-900">#{data.user_position.position}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Coins earned</p>
              <p className="flex items-center gap-1 text-xl font-bold text-amber-600">
                <Coins className="h-5 w-5" />
                {data.user_position.coins_earned}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : !data || data.rankings.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Ranking is empty"
          description="Be the first to collect coins and appear on the ranking!"
        />
      ) : (
        <div className="space-y-2">
          {data.rankings.map((entry) => (
            <Card
              key={entry.client_id}
              className={`transition-all ${
                entry.is_current_user
                  ? "border-rose-300 bg-rose-50/50 ring-1 ring-rose-200"
                  : ""
              }`}
            >
              <CardContent className="flex items-center gap-3 p-3">
                {/* Position */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                  {entry.position <= 3 ? (
                    POSITION_ICONS[entry.position - 1]
                  ) : (
                    <span className="text-sm font-bold text-gray-500">
                      {entry.position}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {entry.name}
                    {entry.is_current_user && (
                      <Badge variant="outline" className="ml-1.5 text-[10px]">
                        You
                      </Badge>
                    )}
                  </p>
                </div>

                {/* Coins */}
                <div className="flex items-center gap-1 text-sm font-bold text-amber-600">
                  <Coins className="h-4 w-4" />
                  {entry.coins_earned}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info */}
      <p className="text-center text-xs text-gray-400">
        {period === "weekly"
          ? "Ranking resets every Monday"
          : "Ranking resets on the first day of the month"}
        . Top 3 earn bonus coins!
      </p>
    </div>
  );
}
