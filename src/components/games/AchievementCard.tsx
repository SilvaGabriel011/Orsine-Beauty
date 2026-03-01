"use client";

import {
  Flame, Zap, Trophy, Sparkles, Medal, ShoppingBag, Crown,
  MessageCircle, CalendarCheck, Coins, Gamepad2, Star,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  flame: Flame,
  fire: Flame,
  zap: Zap,
  trophy: Trophy,
  sparkles: Sparkles,
  medal: Medal,
  "shopping-bag": ShoppingBag,
  crown: Crown,
  "message-circle": MessageCircle,
  "calendar-check": CalendarCheck,
  coins: Coins,
  "gamepad-2": Gamepad2,
  star: Star,
};

interface AchievementCardProps {
  name: string;
  description: string;
  icon: string;
  coinReward: number;
  unlockedAt: string | null;
  category: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  streak: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  games: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  spending: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  social: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
};

export function AchievementCard({
  name,
  description,
  icon,
  coinReward,
  unlockedAt,
  category,
}: AchievementCardProps) {
  const isUnlocked = !!unlockedAt;
  const Icon = ICON_MAP[icon] || Trophy;
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.games;

  return (
    <div
      className={`relative flex items-center gap-3 rounded-xl border p-3 transition-all ${
        isUnlocked
          ? `${colors.border} ${colors.bg}`
          : "border-gray-200 bg-gray-50 opacity-50"
      }`}
    >
      <div
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
          isUnlocked ? `${colors.bg} ${colors.text}` : "bg-gray-200 text-gray-400"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isUnlocked ? "text-gray-900" : "text-gray-400"}`}>
          {name}
        </p>
        <p className="text-xs text-gray-500 line-clamp-1">{description}</p>
        {isUnlocked && unlockedAt && (
          <p className="mt-0.5 text-[10px] text-gray-400">
            Desbloqueada em {new Date(unlockedAt).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>

      <div className="flex-shrink-0">
        {isUnlocked ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            <Coins className="h-3 w-3" />
            +{coinReward}
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
            <Coins className="h-3 w-3" />
            {coinReward}
          </span>
        )}
      </div>
    </div>
  );
}
