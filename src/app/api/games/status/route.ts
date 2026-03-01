import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withErrorHandler } from "@/lib/errors/api-handler";
import { requireAuth } from "@/lib/errors/auth-helpers";
import { getPlayerStats } from "@/lib/gamification";

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const stats = await getPlayerStats(user.id);

  if (!stats) {
    return NextResponse.json({
      game_coins: 0,
      current_streak: 0,
      longest_streak: 0,
      last_checkin_date: null,
      today_plays: {
        checkin: false,
        wheel: false,
        scratch: false,
        quiz: false,
        shake: false,
      },
    });
  }

  return NextResponse.json(stats);
});
