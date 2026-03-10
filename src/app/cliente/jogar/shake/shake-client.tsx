"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ShakeGame } from "@/components/games/ShakeGame";

interface ShakeClientProps {
  initialCoins: number;
  alreadyPlayed: boolean;
}

export function ShakeClient({ initialCoins, alreadyPlayed }: ShakeClientProps) {
  const [coins, setCoins] = useState(initialCoins);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/cliente/jogar"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Shake</h1>
      </div>

      <p className="text-center text-sm text-gray-500">
        Chacoalhe seu celular (ou clique rapidamente) para derrubar moedas!
      </p>

      <ShakeGame
        disabled={alreadyPlayed}
        currentCoins={coins}
        onResult={(earned) => setCoins((prev) => prev + earned)}
      />
    </div>
  );
}
