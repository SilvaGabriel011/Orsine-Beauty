"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ScratchCard } from "@/components/games/ScratchCard";

interface RaspadinhaClientProps {
  initialCoins: number;
  alreadyPlayed: boolean;
}

export function RaspadinhaClient({ initialCoins, alreadyPlayed }: RaspadinhaClientProps) {
  const [coins, setCoins] = useState(initialCoins);

  const handleResult = (earned: number) => {
    setCoins((prev) => prev + earned);
  };

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
        <h1 className="text-xl font-bold text-gray-900">Raspadinha</h1>
      </div>

      <p className="text-center text-sm text-gray-500">
        Toque nas celulas para revelar os simbolos. 3 iguais = premio maximo!
      </p>

      <ScratchCard
        disabled={alreadyPlayed}
        currentCoins={coins}
        onResult={handleResult}
      />
    </div>
  );
}
