"use client";

import { useState, useEffect } from "react";
import { 
  Trophy, 
  Crown, 
  Medal, 
  TrendingUp,
  Loader2,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface TopClient {
  client_id: string;
  full_name: string;
  email: string;
  total_completed: number;
  total_spent: number;
  last_appointment: string;
}

interface TopClientsCardProps {
  className?: string;
}

export default function TopClientsCard({ className }: TopClientsCardProps) {
  const [data, setData] = useState<TopClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"30" | "60">("30");

  useEffect(() => {
    async function fetchTopClients() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/ranking?period=${period}&sort=appointments`);
        const result = await res.json();
        setData(result.rankings?.slice(0, 5) || []);
      } catch (error) {
        console.error("Error fetching top clients:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTopClients();
  }, [period]);

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-4 w-4 text-amber-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Medal className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-xs font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-amber-500" />
            Top 5 Clientes
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={period === "30" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod("30")}
              className="text-xs h-7 px-2"
            >
              30d
            </Button>
            <Button
              variant={period === "60" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod("60")}
              className="text-xs h-7 px-2"
            >
              60d
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhum cliente no período
          </p>
        ) : (
          <div className="space-y-3">
            {data.map((client, index) => (
              <div
                key={client.client_id}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-center w-6">
                  {getMedalIcon(index + 1)}
                </div>
                
                <Avatar className="h-8 w-8">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(client.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">
                    {client.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {client.total_completed} atendimentos
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(client.total_spent)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {index === 0 && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <TrendingUp className="h-3 w-3" />
                        Líder
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
            
            <Link href="/admin/clientes">
              <Button variant="ghost" size="sm" className="w-full mt-2">
                Ver todos os clientes
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
