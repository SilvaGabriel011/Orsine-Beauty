"use client";

import { useState } from "react";
import {
  Coins, Gamepad2, HelpCircle, Trophy,
  ToggleLeft, ToggleRight, Users, TrendingUp,
  Flame,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface GameConfigRow {
  id: string;
  game_type: string;
  config: Record<string, unknown>;
  is_active: boolean;
  updated_at: string;
}

interface GamificacaoAdminClientProps {
  configs: GameConfigRow[];
  stats: {
    totalCoinsInCirculation: number;
    todayPlays: number;
    totalQuestions: number;
    totalAchievements: number;
  };
  topPlayers: {
    id: string;
    full_name: string;
    game_coins: number;
    current_streak: number;
  }[];
}

const GAME_LABELS: Record<string, string> = {
  checkin: "Daily Check-in",
  wheel: "Lucky Wheel",
  scratch: "Scratch Card",
  quiz: "Beauty Quiz",
  shake: "Shake",
};

const GAME_ICONS: Record<string, React.ReactNode> = {
  checkin: <Flame className="h-4 w-4" />,
  wheel: <span className="text-sm">🎡</span>,
  scratch: <span className="text-sm">🎫</span>,
  quiz: <HelpCircle className="h-4 w-4" />,
  shake: <span className="text-sm">📱</span>,
};

export function GamificacaoAdminClient({
  configs: initialConfigs,
  stats,
  topPlayers,
}: GamificacaoAdminClientProps) {
  const [configs, setConfigs] = useState(initialConfigs);
  const [adjustDialog, setAdjustDialog] = useState<{
    playerId: string;
    playerName: string;
  } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");

  const handleToggleGame = async (configId: string, gameType: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/gamificacao/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: configId, is_active: !currentActive }),
      });

      if (!res.ok) {
        toast.error("Error updating");
        return;
      }

      setConfigs((prev) =>
        prev.map((c) =>
          c.id === configId ? { ...c, is_active: !currentActive } : c
        )
      );
      toast.success(`${GAME_LABELS[gameType]} ${!currentActive ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Connection error");
    }
  };

  const handleAdjustCoins = async () => {
    if (!adjustDialog || adjustAmount === 0) return;

    try {
      const res = await fetch("/api/admin/gamificacao/adjust-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: adjustDialog.playerId,
          amount: adjustAmount,
          reason: adjustReason || "Manual adjustment by admin",
        }),
      });

      if (!res.ok) {
        toast.error("Error adjusting coins");
        return;
      }

      toast.success(`${adjustAmount > 0 ? "+" : ""}${adjustAmount} coins for ${adjustDialog.playerName}`);
      setAdjustDialog(null);
      setAdjustAmount(0);
      setAdjustReason("");
    } catch {
      toast.error("Connection error");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gamification</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Coins className="mx-auto mb-2 h-6 w-6 text-amber-500" />
            <p className="text-2xl font-bold">{stats.totalCoinsInCirculation.toLocaleString("en-AU")}</p>
            <p className="text-xs text-muted-foreground">Coins in circulation</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Gamepad2 className="mx-auto mb-2 h-6 w-6 text-rose-500" />
            <p className="text-2xl font-bold">{stats.todayPlays}</p>
            <p className="text-xs text-muted-foreground">Plays today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <HelpCircle className="mx-auto mb-2 h-6 w-6 text-blue-500" />
            <p className="text-2xl font-bold">{stats.totalQuestions}</p>
            <p className="text-xs text-muted-foreground">Quiz questions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="mx-auto mb-2 h-6 w-6 text-purple-500" />
            <p className="text-2xl font-bold">{stats.totalAchievements}</p>
            <p className="text-xs text-muted-foreground">Achievements</p>
          </CardContent>
        </Card>
      </div>

      {/* Game configs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Game Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {configs.map((config) => (
            <div
              key={config.id}
              className={`flex items-center justify-between rounded-lg border p-3 ${
                !config.is_active ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span>{GAME_ICONS[config.game_type]}</span>
                <div>
                  <p className="font-medium text-sm">{GAME_LABELS[config.game_type]}</p>
                  <p className="text-xs text-muted-foreground">
                    {config.is_active ? "Active" : "Disabled"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleGame(config.id, config.game_type, config.is_active)}
              >
                {config.is_active ? (
                  <ToggleRight className="h-6 w-6 text-green-600" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-gray-400" />
                )}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top players */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Top Players
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No players yet.</p>
          ) : (
            <div className="space-y-2">
              {topPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-lg border p-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{player.full_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Coins className="h-3 w-3 text-amber-500" />
                          {player.game_coins}
                        </span>
                        {player.current_streak > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Flame className="h-3 w-3 text-orange-500" />
                            {player.current_streak}d
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Dialog
                    open={adjustDialog?.playerId === player.id}
                    onOpenChange={(open) => {
                      if (!open) setAdjustDialog(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          setAdjustDialog({ playerId: player.id, playerName: player.full_name })
                        }
                      >
                        Adjust
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adjust Coins - {player.full_name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>Current balance: {player.game_coins} coins</Label>
                        </div>
                        <div>
                          <Label>Amount (positive = credit, negative = debit)</Label>
                          <Input
                            type="number"
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label>Reason</Label>
                          <Input
                            value={adjustReason}
                            onChange={(e) => setAdjustReason(e.target.value)}
                            placeholder="Manual adjustment"
                          />
                        </div>
                        <Button onClick={handleAdjustCoins} className="w-full">
                          Confirm Adjustment
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
