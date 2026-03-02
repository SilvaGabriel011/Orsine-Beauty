export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { enAU } from "date-fns/locale";
import type { LoyaltyHistory, LoyaltyRule } from "@/types/database";

export const metadata = { title: "Meus Pontos" };

export default async function MeusPontosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = (await supabase
    .from("profiles")
    .select("loyalty_points")
    .eq("id", user!.id)
    .single()) as unknown as { data: { loyalty_points: number } | null };

  const { data: history } = (await supabase
    .from("loyalty_history")
    .select("*")
    .eq("client_id", user!.id)
    .order("created_at", { ascending: false })) as unknown as { data: LoyaltyHistory[] | null };

  const { data: redeemRules } = (await supabase
    .from("loyalty_rules")
    .select("*")
    .eq("type", "redeem")
    .eq("is_active", true)) as unknown as { data: LoyaltyRule[] | null };

  const points = profile?.loyalty_points || 0;
  const nextReward = redeemRules?.[0];
  const progress = nextReward
    ? Math.min((points / nextReward.points_threshold) * 100, 100)
    : 0;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My Points</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-4xl font-bold text-rose-600">{points} pts</p>
            {nextReward && (
              <div className="mt-4">
                <div className="flex justify-between text-sm">
                  <span>Next Discount</span>
                  <span>
                    {points}/{nextReward.points_threshold} pts
                  </span>
                </div>
                <div className="mt-2 h-3 rounded-full bg-gray-200">
                  <div
                    className="h-3 rounded-full bg-rose-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {nextReward.discount_value > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {nextReward.points_threshold} points = ${" "}
                    {nextReward.discount_value.toFixed(2)} discount
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">How it works</p>
            <ul className="mt-2 space-y-2 text-sm">
              <li>Earn points with every completed appointment</li>
              <li>🎁 Accumulate and redeem for discounts</li>
              <li>💫 The more you come, the more discount you earn</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          {(!history || history.length === 0) ? (
            <p className="py-4 text-center text-muted-foreground">
              No transactions yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left text-xs font-medium text-muted-foreground">Date</TableHead>
                  <TableHead className="text-left text-xs font-medium text-muted-foreground">Description</TableHead>
                  <TableHead className="text-left text-xs font-medium text-muted-foreground">Type</TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {format(new Date(item.created_at), "dd/MM/yyyy", {
                        locale: enAU,
                      })}
                    </TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.type === "earned"
                            ? "bg-green-100 text-green-800"
                            : item.type === "redeemed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }
                      >
                        {item.type === "earned"
                          ? "Ganho"
                          : item.type === "redeemed"
                            ? "Resgatado"
                            : item.type}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        item.points > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {item.points > 0 ? "+" : ""}
                      {item.points}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
