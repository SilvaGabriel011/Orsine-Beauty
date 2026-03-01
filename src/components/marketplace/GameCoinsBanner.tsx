"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Loader2, Tag, Check } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Voucher {
  id: string;
  item_name: string;
  item_type: string;
  coins_spent: number;
  metadata: Record<string, unknown>;
}

interface GameCoinsBannerProps {
  onVoucherApply: (discountValue: number, voucherId: string) => void;
  appliedVoucher: string | null;
}

export default function GameCoinsBanner({
  onVoucherApply,
  appliedVoucher,
}: GameCoinsBannerProps) {
  const [coins, setCoins] = useState(0);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Get game coins
      const { data: profile } = await supabase
        .from("profiles")
        .select("game_coins")
        .eq("id", user.id)
        .single();

      setCoins(((profile as unknown as { game_coins: number })?.game_coins) || 0);

      // Get unused discount/service vouchers (fulfilled redemptions that are discount type)
      const { data: redemptions } = await supabase
        .from("reward_redemptions")
        .select("id, coins_spent, status, reward_store_items(name, type, metadata)")
        .eq("client_id", user.id)
        .eq("status", "fulfilled")
        .order("created_at", { ascending: false });

      if (redemptions) {
        const discountVouchers = redemptions
          .filter((r) => {
            const item = (r as unknown as { reward_store_items: { type: string } }).reward_store_items;
            return item?.type === "discount";
          })
          .map((r) => {
            const row = r as unknown as {
              id: string;
              coins_spent: number;
              reward_store_items: { name: string; type: string; metadata: Record<string, unknown> };
            };
            return {
              id: row.id,
              item_name: row.reward_store_items.name,
              item_type: row.reward_store_items.type,
              coins_spent: row.coins_spent,
              metadata: row.reward_store_items.metadata || {},
            };
          });
        setVouchers(discountVouchers);
      }

      setLoading(false);
    }
    load();
  }, []);

  if (loading || vouchers.length === 0) return null;

  if (appliedVoucher) {
    const applied = vouchers.find((v) => v.id === appliedVoucher);
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="flex items-center gap-3 p-4">
          <Check className="h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-900">
              Voucher aplicado: {applied?.item_name}
            </p>
            <p className="text-xs text-green-700">
              Saldo de moedas: {coins}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Coins className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">
              Voce tem <strong>{vouchers.length} voucher(s)</strong> de desconto disponivel(is)!
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {vouchers.slice(0, 3).map((voucher) => {
            const discountValue = (voucher.metadata?.discount_value as number) || 0;
            return (
              <Button
                key={voucher.id}
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={() => {
                  onVoucherApply(discountValue, voucher.id);
                  toast.success(`Voucher "${voucher.item_name}" aplicado!`);
                }}
              >
                <Tag className="mr-1 h-3 w-3" />
                {voucher.item_name}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
