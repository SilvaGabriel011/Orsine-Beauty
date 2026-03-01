"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { safeFetch } from "@/lib/errors/client";
import { createClient } from "@/lib/supabase/client";

interface RedeemRule {
  id: string;
  name: string;
  points_threshold: number;
  discount_value: number;
}

interface LoyaltyBannerProps {
  onDiscount: (discount: number, ruleId: string) => void;
  appliedDiscount: number;
}

export default function LoyaltyBanner({
  onDiscount,
  appliedDiscount,
}: LoyaltyBannerProps) {
  const [points, setPoints] = useState<number>(0);
  const [rules, setRules] = useState<RedeemRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user: u },
      } = await supabase.auth.getUser();

      if (!u) {
        setLoading(false);
        return;
      }

      setUser(u);

      // Get points
      const { data: profile } = await supabase
        .from("profiles")
        .select("loyalty_points")
        .eq("id", u.id)
        .single();

      setPoints((profile as any)?.loyalty_points || 0);

      // Get redeem rules
      const rulesResult = await safeFetch<any[]>("/api/loyalty/rules");
      if (rulesResult.ok) {
        setRules(
          rulesResult.data.filter(
            (r: any) => r.type === "redeem" && r.is_active
          )
        );
      }

      setLoading(false);
    }
    load();
  }, []);

  async function handleRedeem(rule: RedeemRule) {
    if (appliedDiscount > 0) {
      toast.error("Desconto ja aplicado neste agendamento");
      return;
    }

    setRedeeming(true);

    const result = await safeFetch<{ discountValue: number; pointsDeducted: number }>(
      "/api/loyalty/redeem",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule_id: rule.id }),
      }
    );

    setRedeeming(false);

    if (!result.ok) return;

    onDiscount(result.data.discountValue, rule.id);
    setPoints((prev) => prev - result.data.pointsDeducted);
    toast.success(
      `Desconto de R$ ${result.data.discountValue.toFixed(2)} aplicado!`
    );
  }

  if (loading || !user || rules.length === 0) return null;

  const availableRules = rules.filter((r) => points >= r.points_threshold);

  if (availableRules.length === 0 && appliedDiscount === 0) {
    // Show progress toward next reward
    const nextRule = rules.sort(
      (a, b) => a.points_threshold - b.points_threshold
    )[0];
    if (!nextRule) return null;

    const progress = Math.min(
      (points / nextRule.points_threshold) * 100,
      100
    );

    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="flex items-center gap-3 p-4">
          <Gift className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">
              Voce tem <strong>{points} pontos</strong>
            </p>
            <div className="mt-1 h-1.5 rounded-full bg-amber-200">
              <div
                className="h-1.5 rounded-full bg-amber-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-amber-700">
              Faltam {nextRule.points_threshold - points} pontos para R${" "}
              {nextRule.discount_value.toFixed(2)} de desconto
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (appliedDiscount > 0) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="flex items-center gap-3 p-4">
          <Gift className="h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-900">
              Desconto aplicado: R$ {appliedDiscount.toFixed(2)}
            </p>
            <p className="text-xs text-green-700">
              Saldo restante: {points} pontos
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-rose-200 bg-rose-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Gift className="h-5 w-5 shrink-0 text-rose-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-rose-900">
              Voce tem <strong>{points} pontos</strong> de fidelidade!
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {availableRules.map((rule) => (
            <Button
              key={rule.id}
              variant="outline"
              size="sm"
              disabled={redeeming}
              className="border-rose-300 text-rose-700 hover:bg-rose-100"
              onClick={() => handleRedeem(rule)}
            >
              {redeeming ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : null}
              Usar {rule.points_threshold} pts → R${" "}
              {rule.discount_value.toFixed(2)} off
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
