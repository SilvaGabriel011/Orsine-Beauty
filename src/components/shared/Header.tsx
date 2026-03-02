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
import { useTheme } from "next-themes";
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
import { Menu, User, LogOut, ShoppingBag } from "lucide-react";
import ThemeToggle from "@/components/shared/ThemeToggle";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useCart } from "@/lib/cart-context";
import { motion } from "framer-motion";

// Links de navegacao principais
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/servicos", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/sobre", label: "About" },
  { href: "/agendar", label: "Book Now" },
];

export default function Header() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll position for header transformation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const isHome = pathname === "/";

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: scrolled
          ? isDark ? "rgba(26, 20, 18, 0.85)" : "rgba(253, 248, 244, 0.85)"
          : isHome
            ? isDark ? "rgba(26, 20, 18, 0)" : "rgba(253, 248, 244, 0)"
            : isDark ? "rgba(26, 20, 18, 0.95)" : "rgba(253, 248, 244, 0.95)",
      }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "shadow-[0_2px_30px_rgba(139,34,82,0.06)] backdrop-blur-xl"
          : ""
      }`}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <span className={`font-serif text-xl tracking-wide transition-colors duration-300 ${
            scrolled || !isHome ? "text-warm-900 dark:text-warm-100" : "text-white"
          }`}>
            Bela Orsine
          </span>
          <span className={`font-display text-lg italic tracking-wider transition-colors duration-300 ${
            scrolled || !isHome ? "text-burgundy-600 dark:text-burgundy-400" : "text-gold-300"
          }`}>
            Beauty
          </span>
        </Link>

        {/* Desktop Nav — floating pill style */}
        <nav className="hidden items-center md:flex">
          <div className={`flex items-center gap-0.5 rounded-full px-1.5 py-1 transition-all duration-300 ${
            scrolled ? "bg-warm-200/60 dark:bg-warm-800/60" : ""
          }`}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-full px-4 py-1.5 text-[13px] font-medium tracking-wide transition-all duration-200 ${
                  isActive(link.href)
                    ? "bg-burgundy-600 text-white"
                    : `${scrolled ? "hover:bg-warm-200/80 dark:hover:bg-warm-800/80" : isHome ? "hover:bg-white/10" : "hover:bg-warm-200/80 dark:hover:bg-warm-800/80"} ${
                        scrolled || !isHome ? "text-warm-700 dark:text-warm-300" : "text-warm-200"
                      } ${scrolled || !isHome ? "hover:text-burgundy-700 dark:hover:text-burgundy-400" : "hover:text-white"}`
                } ${link.href === "/agendar" && !isActive(link.href) ? (scrolled || !isHome ? "bg-burgundy-600/10 text-burgundy-600 font-semibold" : "bg-white/15 text-gold-300 font-semibold") : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Desktop Auth + Cart */}
        <div className="hidden items-center gap-1.5 md:flex">
          {/* Theme toggle */}
          <ThemeToggle className={`${
            scrolled || !isHome ? "text-warm-700 hover:text-burgundy-600 hover:bg-warm-200/60" : "text-warm-200 hover:text-white hover:bg-white/10"
          }`} />

          {/* Cart badge */}
          <Link href="/agendar">
            <Button
              variant="ghost"
              size="sm"
              className={`relative gap-2 rounded-full transition-colors ${
                scrolled || !isHome ? "text-warm-700 dark:text-warm-300 hover:text-burgundy-600 dark:hover:text-burgundy-400" : "text-warm-200 hover:text-white"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-burgundy-600 text-[10px] font-bold text-white shadow-lg shadow-burgundy-600/30"
                >
                  {itemCount}
                </motion.span>
              )}
            </Button>
          </Link>

          {user ? (
            <>
              <Link href="/cliente/minha-conta">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-2 rounded-full text-[13px] ${
                    scrolled || !isHome ? "text-warm-700 dark:text-warm-300" : "text-warm-200"
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  {profileName || "My Account"}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2 rounded-full text-warm-500 hover:text-warm-700"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-full text-[13px] ${
                    scrolled || !isHome ? "text-warm-700 dark:text-warm-300" : "text-warm-200"
                  }`}
                >
                  Log In
                </Button>
              </Link>
              <Link href="/auth/cadastro">
                <Button
                  size="sm"
                  className="rounded-full bg-burgundy-600 px-5 text-[13px] text-white shadow-lg shadow-burgundy-600/20 hover:bg-burgundy-700 hover:shadow-xl hover:shadow-burgundy-600/30 transition-all"
                >
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Cart + Menu */}
        <div className="flex items-center gap-1 md:hidden">
          <Link href="/agendar">
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <ShoppingBag className={`h-5 w-5 ${scrolled || !isHome ? "text-warm-700 dark:text-warm-300" : "text-warm-200"}`} />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-burgundy-600 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className={`h-5 w-5 ${scrolled || !isHome ? "text-warm-700 dark:text-warm-300" : "text-warm-200"}`} />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
          <SheetContent side="right" className="w-80 border-l-warm-300 bg-cream dark:bg-[#1A1412] dark:border-l-warm-700 p-0">
            <SheetHeader className="border-b border-warm-200 dark:border-warm-700 px-6 py-5">
              <SheetTitle className="flex items-center gap-2">
                <span className="font-serif text-lg text-warm-900 dark:text-warm-100">
                  Bela Orsine
                </span>
                <span className="font-display text-base italic text-burgundy-600 dark:text-burgundy-400">
                  Beauty
                </span>
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-0.5 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-medium tracking-wide transition-all ${
                    isActive(link.href)
                      ? "bg-burgundy-600 text-white"
                      : "text-warm-700 dark:text-warm-300 hover:bg-warm-200/60 dark:hover:bg-warm-800/60 hover:text-burgundy-700 dark:hover:text-burgundy-400"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Theme toggle */}
            <div className="flex items-center gap-2 border-t border-warm-200 dark:border-warm-700 px-6 py-3">
              <span className="text-sm text-warm-500 dark:text-warm-400">Theme</span>
              <ThemeToggle className="text-warm-700 dark:text-warm-300 hover:bg-warm-200/60 dark:hover:bg-warm-700/60" />
            </div>

            <div className="mt-auto border-t border-warm-200 dark:border-warm-700 px-4 py-5">
              {user ? (
                <div className="flex flex-col gap-2">
                  <Link href="/cliente/minha-conta" onClick={() => setMobileOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 rounded-xl text-warm-700 hover:bg-warm-200/60"
                    >
                      <User className="h-4 w-4" />
                      {profileName || "My Account"}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="w-full justify-start gap-2 rounded-xl text-warm-500 hover:text-warm-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full rounded-xl border-warm-300 text-warm-700">
                      Log In
                    </Button>
                  </Link>
                  <Link href="/auth/cadastro" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full rounded-xl bg-burgundy-600 text-white hover:bg-burgundy-700">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
