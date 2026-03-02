"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SpinWheel } from "@/components/games/SpinWheel";

interface RoletaClientProps {
  segments: Array<{ label: string; coins: number; color: string }>;
  initialCoins: number;
  alreadyPlayed: boolean;
  gameDisabled: boolean;
}

export function RoletaClient({
  segments,
  initialCoins,
  alreadyPlayed,
  gameDisabled,
}: RoletaClientProps) {
  const [coins, setCoins] = useState(initialCoins);

  const handleResult = (earned: number) => {
    setCoins((prev) => prev + earned);
  };

  if (gameDisabled) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-lg text-gray-500">The wheel is currently disabled.</p>
        <Link href="/cliente/jogar" className="text-rose-600 hover:underline">
          Back to games
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/cliente/jogar"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Lucky Wheel</h1>
      </div>

      <p className="text-center text-sm text-gray-500">
        Spin the wheel once a day and win coins! The luckier you are, the more coins you get.
      </p>

      <SpinWheel
        segments={segments}
        disabled={alreadyPlayed}
        currentCoins={coins}
        onResult={handleResult}
      />
    </div>
  );
}
