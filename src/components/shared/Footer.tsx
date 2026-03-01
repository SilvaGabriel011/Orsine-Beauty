import Link from "next/link";
import { Scissors, Instagram, Mail, Phone } from "lucide-react";

const footerLinks = [
  { href: "/servicos", label: "Servicos" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/sobre", label: "Sobre" },
  { href: "/agendar", label: "Agendar" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Logo & Description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600/20">
                <Scissors className="h-5 w-5 text-rose-400" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Bela Orsine
                <span className="font-light text-rose-400"> Beauty</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Estudio de beleza dedicado a realcar a sua beleza natural.
              Sobrancelhas, unhas, depilacao e muito mais.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-300">
              Navegacao
            </h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-rose-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-300">
              Contato
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="tel:+5500000000000"
                  className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-rose-400"
                >
                  <Phone className="h-4 w-4" />
                  (00) 00000-0000
                </a>
              </li>
              <li>
                <a
                  href="mailto:contato@belaorsine.com.br"
                  className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-rose-400"
                >
                  <Mail className="h-4 w-4" />
                  contato@belaorsine.com.br
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-300">
              Redes Sociais
            </h3>
            <div className="flex gap-3">
              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-colors hover:bg-rose-600 hover:text-white"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-gray-800 pt-6 text-center">
          <p className="text-xs text-gray-500">
            &copy; 2025 Bela Orsine Beauty. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
