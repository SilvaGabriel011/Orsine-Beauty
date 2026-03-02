/**
 * Componente: Rodape da Aplicacao
 *
 * Footer com informacoes da empresa, links de navegacao e contato.
 * Estrutura em grid responsiva exibindo logo, descricao, links e
 * canais de contato (email, telefone, redes sociais).
 *
 * Props: nenhuma (componente global)
 */
import Link from "next/link";
import { Instagram, Mail, Phone, ArrowUpRight } from "lucide-react";

// Links de navegacao no footer
const footerLinks = [
  { href: "/servicos", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/sobre", label: "About" },
  { href: "/agendar", label: "Book Now" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-warm-800 dark:bg-[#110E0C] text-warm-300">
      {/* Decorative gold line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Top section — Logo + tagline */}
        <div className="mb-12 text-center">
          <Link href="/" className="inline-block">
            <h2 className="font-serif text-3xl tracking-wide text-warm-100 sm:text-4xl">
              Bela Orsine
            </h2>
            <p className="mt-1 font-display text-lg italic tracking-widest text-gold-400">
              Beauty
            </p>
          </Link>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-warm-400 dark:text-warm-500">
            Enhancing your natural beauty with care, precision and dedication.
          </p>
        </div>

        {/* Navigation links — horizontal */}
        <div className="mb-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-1 text-sm font-medium tracking-wide text-warm-400 transition-colors hover:text-gold-300"
            >
              {link.label}
              <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ))}
        </div>

        {/* Contact + Social — centered row */}
        <div className="mb-12 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10">
          <a
            href="tel:+5500000000000"
            className="flex items-center gap-2 text-sm text-warm-400 transition-colors hover:text-gold-300"
          >
            <Phone className="h-4 w-4" />
            (00) 00000-0000
          </a>
          <a
            href="mailto:contato@belaorsine.com.br"
            className="flex items-center gap-2 text-sm text-warm-400 transition-colors hover:text-gold-300"
          >
            <Mail className="h-4 w-4" />
            contato@belaorsine.com.br
          </a>
          <a
            href="https://instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-warm-400 transition-colors hover:text-gold-300"
          >
            <Instagram className="h-4 w-4" />
            @belaorsine
          </a>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-warm-700/50 pt-6 text-center">
          <p className="text-xs text-warm-500">
            &copy; {new Date().getFullYear()} Bela Orsine Beauty. All rights reserved.
          </p>
        </div>
      </div>

      {/* Decorative background element */}
      <div className="pointer-events-none absolute -bottom-20 left-1/2 h-40 w-[500px] -translate-x-1/2 rounded-full bg-burgundy-600/5 blur-3xl" />
    </footer>
  );
}
