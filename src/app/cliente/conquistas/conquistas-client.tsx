"use client";

import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { AchievementCard } from "@/components/games/AchievementCard";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

interface AchievementItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  coin_reward: number;
  unlocked_at: string | null;
}

interface ConquistasClientProps {
  achievements: AchievementItem[];
}

const CATEGORY_LABELS: Record<string, string> = {
  streak: "Streak",
  games: "Minigames",
  spending: "Shop",
  social: "Social",
};

export function ConquistasClient({ achievements }: ConquistasClientProps) {
  const totalUnlocked = achievements.filter((a) => a.unlocked_at).length;

  // Show empty state if no achievements
  if (!achievements || achievements.length === 0) {
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
          <h1 className="text-xl font-bold text-gray-900">Achievements</h1>
        </div>
        <EmptyState
          icon={Trophy}
          title="No achievements yet"
          description="Play the daily minigames and complete appointments to unlock achievements."
          action={{ label: "Go to games", href: "/cliente/jogar" }}
        />
      </div>
    );
  }

  // Group by category
  const grouped = achievements.reduce<Record<string, AchievementItem[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/cliente/jogar"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Jogos
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Conquistas</h1>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 p-4">
        <Trophy className="h-8 w-8 text-purple-500" />
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {totalUnlocked}/{achievements.length}
          </p>
          <p className="text-xs text-gray-500">achievements unlocked</p>
        </div>
      </div>

      {/* Grouped achievements */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-700">
              {CATEGORY_LABELS[category] || category}
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              {items.filter((a) => a.unlocked_at).length}/{items.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {items.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                name={achievement.name}
                description={achievement.description}
                icon={achievement.icon}
                coinReward={achievement.coin_reward}
                unlockedAt={achievement.unlocked_at}
                category={achievement.category}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
