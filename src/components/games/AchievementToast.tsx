"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Coins } from "lucide-react";

interface AchievementToastProps {
  name: string;
  description: string;
  coinReward: number;
  visible: boolean;
  onClose: () => void;
}

export function AchievementToast({
  name,
  description,
  coinReward,
  visible,
  onClose,
}: AchievementToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2"
          onClick={onClose}
        >
          <div className="flex items-center gap-3 rounded-2xl border border-purple-300 bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-3 text-white shadow-xl shadow-purple-200">
            <Trophy className="h-8 w-8 text-amber-300" />
            <div>
              <p className="text-sm font-bold">Conquista Desbloqueada!</p>
              <p className="text-xs font-medium opacity-90">{name}</p>
              <p className="flex items-center gap-1 text-xs opacity-75">
                <Coins className="h-3 w-3" />
                +{coinReward} moedas
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
