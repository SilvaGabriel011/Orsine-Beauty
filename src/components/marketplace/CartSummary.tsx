"use client";

import { Clock, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/lib/cart-context";

export default function CartSummary() {
  const { items, removeItem, totalPrice, totalDuration, itemCount } = useCart();

  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalPrice);

  if (itemCount === 0) return null;

  return (
    <Card className="border-rose-100">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingBag className="h-4 w-4 text-rose-600" />
          Servicos selecionados
          <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
            {itemCount}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Service list */}
        {items.map((item) => {
          const price = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(item.service.price);

          return (
            <div
              key={item.service.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {item.service.name}
                </p>
                <p className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {item.service.duration_minutes} min
                  </span>
                  <span>{price}</span>
                </p>
              </div>
              <button
                onClick={() => removeItem(item.service.id)}
                className="ml-2 shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}

        {/* Totals */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Duracao total estimada
            </span>
            <span className="font-medium">{totalDuration} min</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Total</span>
            <span className="text-lg font-bold text-rose-600">
              {formattedTotal}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
