/**
 * Componente: Botao flutuante do WhatsApp
 *
 * Botao fixo flutuante (FAB) no canto inferior direito para enviar mensagem
 * via WhatsApp. Responsivo: sobe quando a barra de carrinho fica visivel
 * no mobile. Link direto para conversas WhatsApp.
 *
 * Props: nenhuma (componente global)
 *
 * Dependencias: CartContext (para saber se carrinho esta visivel)
 */
"use client";

import { MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function WhatsAppButton() {
  const { itemCount } = useCart();

  // Ajusta posicao vertical do botao: sobe quando carrinho esta visivel
  const bottomClass = itemCount > 0 ? "bottom-24 md:bottom-6" : "bottom-6";

  return (
    <a
      href="https://wa.me/5500000000000"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={`fixed right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all hover:scale-110 hover:bg-green-600 hover:shadow-xl ${bottomClass}`}
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
