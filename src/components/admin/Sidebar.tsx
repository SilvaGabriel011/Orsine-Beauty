/**
 * Componente: Sidebar Administrativa
 *
 * Menu lateral da area administrativa com navegacao entre paineis.
 * Exibe informacoes do usuario e botao de logout. Responsivo: em mobile,
 * o menu fica em uma gaveta deslizavel.
 *
 * Props:
 * - profile: Dados do usuario (nome e email)
 *
 * Secoes:
 * - Dashboard: visao geral
 * - Agendamentos: gerenciar reservas
 * - Categorias: gerenciar categorias
 * - Servicos: gerenciar servicos
 * - Horarios: gerenciar disponibilidade
 * - Portfolio: gerenciar galeria
 * - Feedbacks: avaliacoes de clientes
 * - Fidelidade: programa de pontos
 * - Gamificacao: minigames
 * - Loja: loja de recompensas
 * - Clientes: lista de clientes
 * - Configuracoes: ajustes do sistema
 */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  FolderOpen,
  Scissors,
  Clock,
  Image,
  MessageSquare,
  Award,
  Users,
  Settings,
  LogOut,
  Menu,
  Gamepad2,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// Itens do menu de navegacao
const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/agendamentos", label: "Bookings", icon: CalendarDays },
  { href: "/admin/categorias", label: "Categories", icon: FolderOpen },
  { href: "/admin/servicos", label: "Services", icon: Scissors },
  { href: "/admin/horarios", label: "Schedule", icon: Clock },
  { href: "/admin/portfolio", label: "Portfolio", icon: Image },
  { href: "/admin/feedbacks", label: "Reviews", icon: MessageSquare },
  { href: "/admin/fidelidade", label: "Loyalty", icon: Award },
  { href: "/admin/gamificacao", label: "Gamification", icon: Gamepad2 },
  { href: "/admin/loja", label: "Rewards Shop", icon: Store },
  { href: "/admin/clientes", label: "Clients", icon: Users },
  { href: "/admin/configuracoes", label: "Settings", icon: Settings },
];

interface SidebarProps {
  profile: {
    name: string | null;
    email: string | null;
  };
}

// Links de navegacao da sidebar
function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {/* Renderiza cada item de menu */}
      {navItems.map((item) => {
        // Verifica se o link atual esta ativo
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-rose-50 text-rose-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive ? "text-rose-600" : "text-gray-400")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserSection({ profile }: { profile: SidebarProps["profile"] }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="p-4">
      <Separator className="mb-4" />
      <div className="flex items-center gap-3">
        <Avatar size="default">
          <AvatarFallback className="bg-rose-100 text-rose-700 text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {profile.name || "Admin"}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {profile.email || ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleLogout}
          className="text-gray-400 hover:text-gray-600"
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SidebarContent({
  profile,
  onNavigate,
}: SidebarProps & { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold text-rose-600">Bela Orsine</span>
        </Link>
      </div>

      <Separator />

      {/* Navigation */}
      <NavLinks onNavigate={onNavigate} />

      {/* User section */}
      <UserSection profile={profile} />
    </div>
  );
}

export function Sidebar({ profile }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col border-r bg-white">
        <SidebarContent profile={profile} />
      </aside>

      {/* Mobile header with sheet trigger */}
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-4 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <SidebarContent profile={profile} />
          </SheetContent>
        </Sheet>
        <span className="text-lg font-bold text-rose-600">Bela Orsine</span>
      </header>
    </>
  );
}
