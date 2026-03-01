/**
 * Componente: Gaveta do Carrinho (Cart Drawer)
 *
 * Modal deslizavel que exibe todos os itens adicionados ao carrinho.
 * Permite visualizar detalhes (nome, duracao, preco), remover itens,
 * ver total e prosseguir para o checkout.
 *
 * Props:
 * - open: Controla visibilidade da gaveta
 * - onOpenChange: Callback quando a gaveta abre ou fecha
 *
 * Integracao: Usa CartContext para gerenciar itens
 */
"use client";

import Link from "next/link";
import { Clock, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useCart } from "@/lib/cart-context";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, removeItem, clearCart, totalPrice, totalDuration, itemCount } =
    useCart();

  // Formata o total em moeda brasileira
  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalPrice);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        {/* Header com titulo e contador de itens */}
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="h-5 w-5 text-rose-600" />
            Seu carrinho
            <span className="ml-auto text-sm font-normal text-gray-500">
              {itemCount} {itemCount === 1 ? "item" : "itens"}
            </span>
          </DrawerTitle>
        </DrawerHeader>

        {/* Lista de itens do carrinho */}
        <div className="max-h-[50vh] overflow-y-auto px-4 py-3">
          {items.length === 0 ? (
            // Estado vazio - carrinho nao tem itens
            <div className="py-8 text-center text-gray-500">
              <ShoppingBag className="mx-auto mb-2 h-10 w-10 text-gray-300" />
              <p className="text-sm">Seu carrinho esta vazio</p>
            </div>
          ) : (
            // Lista de servicos adicionados ao carrinho
            <div className="space-y-3">
              {items.map((item) => {
                // Formata o preco em moeda brasileira
                const price = new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(item.service.price);

                return (
                  <div
                    key={item.service.id}
                    className="flex items-center gap-3 rounded-xl bg-gray-50 p-3"
                  >
                    {/* Imagem do servico ou iniciais */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-rose-100">
                      {item.service.image_url ? (
                        <img
                          src={item.service.image_url}
                          alt={item.service.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-medium text-rose-600">
                          {item.service.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Informacoes do servico (nome, duracao, preco) */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {item.service.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {item.service.duration_minutes} min
                        </span>
                        <span className="font-semibold text-rose-600">
                          {price}
                        </span>
                      </div>
                    </div>

                    {/* Botao para remover item do carrinho */}
                    <button
                      onClick={() => removeItem(item.service.id)}
                      className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodape com resumo e botoes de acao */}
        {itemCount > 0 && (
          <DrawerFooter className="border-t pt-4">
            {/* Exibe totais: duracao estimada e preco total */}
            <div className="mb-2 space-y-1">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Duracao estimada
                </span>
                <span className="font-medium">{totalDuration} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  Total
                </span>
                <span className="text-xl font-bold text-rose-600">
                  {formattedTotal}
                </span>
              </div>
            </div>

            {/* Botao primario para escolher horario e prosseguir */}
            <Link href="/agendar/checkout" onClick={() => onOpenChange(false)}>
              <Button className="w-full gap-2 bg-rose-600 text-white hover:bg-rose-700">
                Escolher horario
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            {/* Botao secundario para limpar todo o carrinho */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-gray-500 hover:text-red-600"
              onClick={() => {
                clearCart();
                onOpenChange(false);
              }}
            >
              Limpar carrinho
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
