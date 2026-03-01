"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Tag, Sparkles, Package, ShoppingBag, Check, Clock, X } from "lucide-react";
import { CoinBalance } from "@/components/games/CoinBalance";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface StoreItem {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  type: "discount" | "service" | "product";
  coin_price: number;
  metadata: Record<string, unknown>;
  stock: number | null;
  sort_order: number;
}

interface Redemption {
  id: string;
  item_id: string;
  coins_spent: number;
  status: "pending" | "fulfilled" | "cancelled";
  fulfilled_at: string | null;
  notes: string | null;
  created_at: string;
  reward_store_items: {
    name: string;
    type: string;
    image_url: string | null;
  };
}

interface LojaClientProps {
  initialCoins: number;
  items: StoreItem[];
  redemptions: Redemption[];
}

const TYPE_ICONS = {
  discount: <Tag className="h-5 w-5" />,
  service: <Sparkles className="h-5 w-5" />,
  product: <Package className="h-5 w-5" />,
};

const TYPE_LABELS = {
  discount: "Desconto",
  service: "Servico",
  product: "Produto",
};

const TYPE_COLORS = {
  discount: "bg-green-100 text-green-700",
  service: "bg-blue-100 text-blue-700",
  product: "bg-purple-100 text-purple-700",
};

const STATUS_MAP = {
  pending: { label: "Pendente", icon: <Clock className="h-3.5 w-3.5" />, color: "bg-amber-100 text-amber-700" },
  fulfilled: { label: "Entregue", icon: <Check className="h-3.5 w-3.5" />, color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelado", icon: <X className="h-3.5 w-3.5" />, color: "bg-red-100 text-red-700" },
};

export function LojaClient({ initialCoins, items, redemptions }: LojaClientProps) {
  const [coins, setCoins] = useState(initialCoins);
  const [confirmItem, setConfirmItem] = useState<StoreItem | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [myRedemptions, setMyRedemptions] = useState(redemptions);
  const [filter, setFilter] = useState<"all" | "discount" | "service" | "product">("all");

  const filteredItems = filter === "all" ? items : items.filter((i) => i.type === filter);

  const handleRedeem = async () => {
    if (!confirmItem || isRedeeming) return;

    setIsRedeeming(true);
    try {
      const res = await fetch("/api/store/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: confirmItem.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error?.message || "Erro ao trocar");
        return;
      }

      setCoins(data.remaining_coins);
      toast.success(`Troca realizada! Voce adquiriu "${confirmItem.name}"`);

      // Add to redemptions list
      setMyRedemptions((prev) => [
        {
          id: data.redemption_id,
          item_id: confirmItem.id,
          coins_spent: confirmItem.coin_price,
          status: confirmItem.type === "product" ? "pending" : "fulfilled",
          fulfilled_at: confirmItem.type !== "product" ? new Date().toISOString() : null,
          notes: null,
          created_at: new Date().toISOString(),
          reward_store_items: {
            name: confirmItem.name,
            type: confirmItem.type,
            image_url: confirmItem.image_url,
          },
        },
        ...prev,
      ]);
    } catch {
      toast.error("Erro de conexao.");
    } finally {
      setIsRedeeming(false);
      setConfirmItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/cliente/jogar"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Jogos
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Loja de Recompensas</h1>
      </div>

      {/* Balance */}
      <div className="flex justify-center">
        <CoinBalance coins={coins} size="lg" />
      </div>

      <Tabs defaultValue="store">
        <TabsList className="w-full">
          <TabsTrigger value="store" className="flex-1">
            <ShoppingBag className="mr-1.5 h-4 w-4" />
            Loja
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1">
            <Package className="mr-1.5 h-4 w-4" />
            Minhas Trocas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="mt-4 space-y-4">
          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto">
            {(["all", "discount", "service", "product"] as const).map((type) => (
              <Button
                key={type}
                variant={filter === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(type)}
                className={filter === type ? "bg-rose-500 hover:bg-rose-600" : ""}
              >
                {type === "all" ? "Todos" : TYPE_LABELS[type]}
              </Button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              Nenhum item disponivel nesta categoria.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredItems.map((item) => {
                const canAfford = coins >= item.coin_price;
                const outOfStock = item.stock !== null && item.stock <= 0;

                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${TYPE_COLORS[item.type]}`}
                        >
                          {TYPE_ICONS[item.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                          <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <CoinBalance coins={item.coin_price} size="sm" />
                            {item.stock !== null && (
                              <Badge variant="outline" className="text-[10px]">
                                {item.stock} restantes
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => setConfirmItem(item)}
                        disabled={!canAfford || outOfStock}
                        size="sm"
                        className="mt-3 w-full"
                        variant={canAfford && !outOfStock ? "default" : "secondary"}
                      >
                        {outOfStock
                          ? "Esgotado"
                          : !canAfford
                            ? `Faltam ${item.coin_price - coins} moedas`
                            : "Trocar"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {myRedemptions.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              Voce ainda nao fez nenhuma troca.
            </p>
          ) : (
            <div className="space-y-3">
              {myRedemptions.map((r) => {
                const status = STATUS_MAP[r.status];
                return (
                  <Card key={r.id}>
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900">
                          {r.reward_store_items.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <CoinBalance coins={r.coins_spent} size="sm" />
                          <span className="text-[10px] text-gray-400">
                            {new Date(r.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                      <Badge className={`${status.color} flex items-center gap-1 text-[10px]`}>
                        {status.icon}
                        {status.label}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation dialog */}
      <AlertDialog open={!!confirmItem} onOpenChange={() => setConfirmItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Troca</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja trocar <strong>{confirmItem?.coin_price} moedas</strong> por{" "}
              <strong>{confirmItem?.name}</strong>?
              {confirmItem?.type === "product" && (
                <span className="block mt-1 text-amber-600">
                  Produtos fisicos serao entregues no proximo atendimento.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRedeeming}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRedeem} disabled={isRedeeming}>
              {isRedeeming ? "Trocando..." : "Confirmar Troca"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
