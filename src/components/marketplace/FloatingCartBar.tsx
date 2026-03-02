"use client";

import Link from "next/link";
import { ShoppingBag, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import CartDrawer from "./CartDrawer";
import { useState } from "react";

export default function FloatingCartBar() {
  const { items, totalPrice, totalDuration, itemCount, isHydrated } =
    useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!isHydrated || itemCount === 0) return null;

  const formattedPrice = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(totalPrice);

  return (
    <>
      {/* Mobile: full-width bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-warm-200/50 bg-white/90 px-4 py-3 shadow-[0_-4px_30px_rgba(139,34,82,0.08)] backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between">
          {/* Cart info (clickable to open drawer) */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-1 items-center gap-3"
            aria-label={`Cart with ${itemCount} item${itemCount > 1 ? 's' : ''}`}
          >
            <div className="relative">
              <ShoppingBag className="h-6 w-6 text-burgundy-600" />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-burgundy-600 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-warm-900">
                {formattedPrice}
              </p>
              <p className="flex items-center gap-1 text-[11px] text-warm-500">
                <Clock className="h-3 w-3" />
                {totalDuration} min
              </p>
            </div>
          </button>

          {/* CTA Button */}
          <Link href="/agendar/checkout">
            <Button className="gap-2 rounded-full bg-burgundy-600 text-white shadow-lg shadow-burgundy-600/20 hover:bg-burgundy-700">
              Choose time
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Desktop: floating bar */}
      <div className="fixed bottom-6 left-1/2 z-50 hidden -translate-x-1/2 md:block">
        <div className="flex items-center gap-6 rounded-2xl border border-warm-200/50 bg-white/90 px-6 py-3 shadow-2xl shadow-burgundy-600/10 backdrop-blur-xl">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-3"
            aria-label={`Cart with ${itemCount} item${itemCount > 1 ? 's' : ''}`}
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5 text-burgundy-600" />
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-burgundy-600 text-[9px] font-bold text-white">
                {itemCount}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-warm-900">
                {itemCount} {itemCount === 1 ? "service" : "services"}
              </p>
              <p className="flex items-center gap-1 text-xs text-warm-500">
                <Clock className="h-3 w-3" />
                {totalDuration} min estimated
              </p>
            </div>
          </button>

          <div className="h-8 w-px bg-warm-200" />

          <p className="text-lg font-bold text-burgundy-600">{formattedPrice}</p>

          <Link href="/agendar/checkout">
            <Button className="gap-2 rounded-full bg-burgundy-600 text-white shadow-lg shadow-burgundy-600/20 hover:bg-burgundy-700 transition-all">
              Choose time
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Cart Drawer (mobile) */}
      <CartDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      {/* Spacer for mobile to prevent content from being hidden behind the bar */}
      <div className="h-20 md:hidden" />
    </>
  );
}
