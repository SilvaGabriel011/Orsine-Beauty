/**
 * Modulo de Carrinho — Bela Orsine Beauty (Client-side)
 *
 * Context React que gerencia carrinho de servicos selecionados para agendamento.
 * Usa sessionStorage para persistir entre reloads na mesma sessao.
 *
 * Workflow:
 * 1. Cliente seleciona servicos → addItem
 * 2. Carrinho persiste em sessionStorage
 * 3. Cliente vai para checkout → vê totalPrice, totalDuration, items
 * 4. Apos agendamento, clearCart limpa sessionStorage
 *
 * Nota: Validacao estrutural de dados ao carregar (previne corruption).
 * Toasts do sonner informam ao usuario a cada acao.
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Service } from "@/types/database";
import { toast } from "sonner";

// ============================
// Tipos
// ============================

export interface CartItem {
  service: Service;
}

interface CartContextType {
  items: CartItem[];                // Servicos no carrinho
  addItem: (service: Service) => void;
  removeItem: (serviceId: string) => void;
  clearCart: () => void;
  isInCart: (serviceId: string) => boolean;
  totalPrice: number;              // Soma dos precos (em reais)
  totalDuration: number;           // Soma das duracoes (em minutos)
  itemCount: number;               // Numero de servicos
  isHydrated: boolean;             // Flag: dados ja foram carregados do storage
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "bela-orsine-cart";

// ============================
// Provider Component
// ============================

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // ── Carrega carrinho do sessionStorage no mount ──────────
  // SSR-safe: so executa no cliente
  // Validacao estrutural: protege contra dados corrompidos
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Valida estrutura antes de usar
        // Verifica: eh array? cada item tem service? service tem id/name/price?
        if (
          Array.isArray(parsed) &&
          parsed.every(
            (item: unknown) =>
              typeof item === "object" &&
              item !== null &&
              "service" in item &&
              typeof (item as CartItem).service?.id === "string" &&
              typeof (item as CartItem).service?.name === "string" &&
              typeof (item as CartItem).service?.price === "number"
          )
        ) {
          setItems(parsed as CartItem[]);
        } else {
          // Dados corrompidos: limpa
          sessionStorage.removeItem(CART_STORAGE_KEY);
        }
      }
    } catch {
      // Erro ao fazer parse: limpa dados corrompidos
      try { sessionStorage.removeItem(CART_STORAGE_KEY); } catch { /* ignore */ }
    }
    setIsHydrated(true);
  }, []);

  // ── Persiste carrinho em sessionStorage quando mudar ──────
  // Aguarda hidratacao antes de persistir (evita sobrescrita)
  useEffect(() => {
    if (!isHydrated) return;
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore erros (ex: quota excedida)
    }
  }, [items, isHydrated]);

  // ── Adiciona servico ao carrinho ──────────────────────────
  const addItem = useCallback(
    (service: Service) => {
      // Valida se ja esta no carrinho (permite apenas 1 unidade de cada)
      const alreadyInCart = items.some(
        (item) => item.service.id === service.id
      );
      if (alreadyInCart) {
        toast.info("Servico ja esta no carrinho");
        return;
      }
      setItems((prev) => [...prev, { service }]);
      toast.success(`${service.name} adicionado ao carrinho`);
    },
    [items]
  );

  // ── Remove servico do carrinho ─────────────────────────────
  const removeItem = useCallback((serviceId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.service.id === serviceId);
      if (item) {
        toast.info(`${item.service.name} removido do carrinho`);
      }
      return prev.filter((i) => i.service.id !== serviceId);
    });
  }, []);

  // ── Esvazia carrinho completamente ─────────────────────────
  const clearCart = useCallback(() => {
    setItems([]);
    try {
      sessionStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Ignora erros
    }
  }, []);

  // ── Verifica se um servico esta no carrinho ────────────────
  const isInCart = useCallback(
    (serviceId: string) => {
      return items.some((item) => item.service.id === serviceId);
    },
    [items]
  );

  // ── Calcula totais de preco e duracao (useMemo para otimizacao) ──
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.service.price, 0),
    [items]
  );
  const totalDuration = useMemo(
    () => items.reduce((sum, item) => sum + item.service.duration_minutes, 0),
    [items]
  );
  const itemCount = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        isInCart,
        totalPrice,
        totalDuration,
        itemCount,
        isHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ============================
// Hook de Uso
// ============================

/**
 * Hook para acessar carrinho de servicos.
 * Deve ser usado dentro de CartProvider.
 *
 * Exemplo:
 *   const cart = useCart()
 *   cart.addItem(service)
 *   console.log(cart.totalPrice)
 */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
}
