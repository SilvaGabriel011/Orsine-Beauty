/**
 * Componente: Cabecalho da Aplicacao
 *
 * Navigation bar fixa com logo, links de navegacao, carrinho de compras,
 * e autenticacao de usuario. Responsivo: exibe menu hamburguer no mobile.
 * Integrado com autenticacao Supabase e gerenciamento de carrinho.
 *
 * Estados:
 * - Nao autenticado: links de login/cadastro
 * - Autenticado: nome do usuario, botao de logout
 * - Carrinho: icone com contador de itens
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, User, LogOut, Scissors, ShoppingBag } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useCart } from "@/lib/cart-context";

// Links de navegacao principais
const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/servicos", label: "Servicos" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/sobre", label: "Sobre" },
  { href: "/agendar", label: "Agendar" },
];

export default function Header() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Effect para carregar usuario no carregamento e monitorar mudancas de autenticacao
  useEffect(() => {
    const supabase = createClient();

    // Funcao assincrona para carregar dados do usuario
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      // Se usuario esta autenticado, carrega seu nome do perfil
      if (user) {
        const { data: profile } = await (supabase
          .from("profiles") as any)
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (profile) {
          setProfileName(profile.full_name);
        }
      }
    }

    getUser();

    // Monitora mudancas no estado de autenticacao
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfileName(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Funcao para fazer logout
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfileName(null);
    window.location.href = "/";
  }

  // Verifica se um link esta ativo baseado na rota atual
  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100">
            <Scissors className="h-5 w-5 text-rose-600" />
          </div>
          <span className="text-lg font-bold tracking-tight text-rose-900">
            Bela Orsine
            <span className="font-light text-rose-600"> Beauty</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-rose-50 text-rose-700"
                  : "text-gray-600 hover:bg-rose-50/50 hover:text-rose-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth + Cart */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Cart badge */}
          <Link href="/agendar">
            <Button variant="ghost" size="sm" className="relative gap-2 text-gray-700">
              <ShoppingBag className="h-4 w-4" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <>
              <Link href="/minha-conta">
                <Button variant="ghost" size="sm" className="gap-2 text-gray-700">
                  <User className="h-4 w-4" />
                  {profileName || "Minha Conta"}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2 text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-gray-700">
                  Entrar
                </Button>
              </Link>
              <Link href="/auth/cadastro">
                <Button
                  size="sm"
                  className="bg-rose-600 text-white hover:bg-rose-700"
                >
                  Cadastrar
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Cart + Menu */}
        <div className="flex items-center gap-1 md:hidden">
          <Link href="/agendar">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="h-5 w-5 text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-rose-900">
                <Scissors className="h-5 w-5 text-rose-600" />
                Bela Orsine Beauty
              </SheetTitle>
            </SheetHeader>

            <nav className="mt-6 flex flex-col gap-1 px-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-rose-50 text-rose-700"
                      : "text-gray-600 hover:bg-rose-50/50 hover:text-rose-600"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 border-t px-2 pt-6">
              {user ? (
                <div className="flex flex-col gap-2">
                  <Link href="/minha-conta" onClick={() => setMobileOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-gray-700"
                    >
                      <User className="h-4 w-4" />
                      {profileName || "Minha Conta"}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="w-full justify-start gap-2 text-gray-500 hover:text-gray-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Entrar
                    </Button>
                  </Link>
                  <Link href="/auth/cadastro" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-rose-600 text-white hover:bg-rose-700">
                      Cadastrar
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
        </div>
      </div>
    </header>
  );
}
