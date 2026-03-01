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
// Types
// ============================

export interface CartItem {
  service: Service;
}

interface CartContextType {
  items: CartItem[];
  addItem: (service: Service) => void;
  removeItem: (serviceId: string) => void;
  clearCart: () => void;
  isInCart: (serviceId: string) => boolean;
  totalPrice: number;
  totalDuration: number;
  itemCount: number;
  isHydrated: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "bela-orsine-cart";

// ============================
// Provider
// ============================

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from sessionStorage on mount (SSR-safe) with validation
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate structure before using
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
          // Clear corrupted data
          sessionStorage.removeItem(CART_STORAGE_KEY);
        }
      }
    } catch {
      // Clear corrupted data on parse errors
      try { sessionStorage.removeItem(CART_STORAGE_KEY); } catch { /* ignore */ }
    }
    setIsHydrated(true);
  }, []);

  // Persist to sessionStorage on change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore
    }
  }, [items, isHydrated]);

  const addItem = useCallback(
    (service: Service) => {
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

  const removeItem = useCallback((serviceId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.service.id === serviceId);
      if (item) {
        toast.info(`${item.service.name} removido do carrinho`);
      }
      return prev.filter((i) => i.service.id !== serviceId);
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      sessionStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const isInCart = useCallback(
    (serviceId: string) => {
      return items.some((item) => item.service.id === serviceId);
    },
    [items]
  );

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
// Hook
// ============================

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
}
