import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User, CalendarDays, Star, Gamepad2, Coins } from "lucide-react";

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/cliente/meus-agendamentos");
  }

  const { data: profile } = (await supabase
    .from("profiles")
    .select("full_name, loyalty_points, game_coins")
    .eq("id", user.id)
    .single()) as unknown as { data: { full_name: string; loyalty_points: number; game_coins: number } | null };

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-warm-200/50 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-lg text-warm-900">Bela Orsine</span>
            <span className="font-display text-sm italic text-burgundy-600">Beauty</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-warm-600">
              {profile?.full_name}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2.5 py-1 text-xs font-semibold text-gold-700">
              <Coins className="h-3 w-3" />
              {profile?.game_coins || 0}
            </span>
            <span className="rounded-full bg-burgundy-100 px-3 py-1 text-xs font-semibold text-burgundy-700">
              {profile?.loyalty_points || 0} pts
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <nav className="mb-6 flex gap-2 overflow-x-auto border-b border-warm-200/50 pb-4 scrollbar-hide">
          <Link
            href="/cliente/minha-conta"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-warm-600 transition-all hover:bg-warm-200/50 hover:text-burgundy-700 whitespace-nowrap"
          >
            <User className="h-4 w-4" />
            My Account
          </Link>
          <Link
            href="/cliente/meus-agendamentos"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-warm-600 transition-all hover:bg-warm-200/50 hover:text-burgundy-700 whitespace-nowrap"
          >
            <CalendarDays className="h-4 w-4" />
            My Bookings
          </Link>
          <Link
            href="/cliente/meus-pontos"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-warm-600 transition-all hover:bg-warm-200/50 hover:text-burgundy-700 whitespace-nowrap"
          >
            <Star className="h-4 w-4" />
            My Points
          </Link>
          <Link
            href="/cliente/jogar"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-50 to-gold-100 px-3 py-2 text-sm font-medium text-gold-700 hover:from-gold-100 hover:to-gold-200 transition-all whitespace-nowrap"
          >
            <Gamepad2 className="h-4 w-4" />
            Play
          </Link>
        </nav>

        {children}
      </div>
    </div>
  );
}
