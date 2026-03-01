/**
 * Layout raiz da aplicacao
 *
 * Configura:
 * - Fontes (Geist Sans e Mono)
 * - Estilos globais CSS
 * - Metadata (titulo, descricao, etc)
 * - Sistema de notificacoes (Toaster)
 *
 * Aplicado a todas as paginas da aplicacao.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
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

// Metadata global com titulo template para outras paginas
export const metadata: Metadata = {
  title: {
    default: "Bela Orsine Beauty",
    template: "%s | Bela Orsine Beauty",
  },
  description:
    "Estudio de beleza especializado em sobrancelha, unhas e depilacao. Agende online!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
