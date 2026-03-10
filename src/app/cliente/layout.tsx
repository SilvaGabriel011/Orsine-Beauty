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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-rose-600">
            Bela Orsine Beauty
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile?.full_name}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <Coins className="h-3 w-3" />
              {profile?.game_coins || 0}
            </span>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
              {profile?.loyalty_points || 0} pts
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <nav className="mb-6 flex gap-4 border-b pb-4">
          <Link
            href="/cliente/minha-conta"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-rose-50"
          >
            <User className="h-4 w-4" />
            Minha Conta
          </Link>
          <Link
            href="/cliente/meus-agendamentos"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-rose-50"
          >
            <CalendarDays className="h-4 w-4" />
            Meus Agendamentos
          </Link>
          <Link
            href="/cliente/meus-pontos"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-rose-50"
          >
            <Star className="h-4 w-4" />
            Meus Pontos
          </Link>
          <Link
            href="/cliente/jogar"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2 text-sm font-medium text-amber-700 hover:from-amber-100 hover:to-orange-100"
          >
            <Gamepad2 className="h-4 w-4" />
            Jogar
          </Link>
        </nav>

        {children}
      </div>
    </div>
  );
}
