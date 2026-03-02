/**
 * Layout raiz da aplicacao
 *
 * Configura:
 * - Fontes (Geist Sans e Mono)
 * - Estilos globais CSS
 * - Metadata (titulo, descricao, etc)
 * - Sistema de notificacoes (Toaster)
 * - TooltipProvider para tooltips acessiveis
 *
 * Aplicado a todas as paginas da aplicacao.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Cormorant_Garamond } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers";
import "./globals.css";

// Fonte sans serif principal
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Fonte monoespacada para codigos
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fonte serif editorial para headings
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Fonte serif elegante para detalhes decorativos
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

// Metadata global com titulo template para outras paginas
export const metadata: Metadata = {
  title: {
    default: "Bela Orsine Beauty",
    template: "%s | Bela Orsine Beauty",
  },
  description:
    "Premium beauty studio specialising in brows, nails, waxing and more. Book online!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${cormorant.variable} font-sans antialiased`}
      >
        <Providers>
          <TooltipProvider delayDuration={300}>
            {children}
          </TooltipProvider>
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
