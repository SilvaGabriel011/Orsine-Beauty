"use client";

import { useState, useEffect } from "react";
import { 
  Crown, 
  Medal, 
  Trophy, 
  Loader2, 
  Coins, 
  Calendar,
  TrendingUp,
  User,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientRankingEntry {
  client_id: string;
  full_name: string;
  email: string;
  total_completed: number;
  total_spent: number;
  last_appointment: string;
  avg_rating?: number;
  total_loyalty_points?: number;
}

interface RankingStats {
  total_clients: number;
  total_appointments: number;
  avg_appointments_per_client: number;
  total_revenue: number;
}

interface ClientRankingProps {
  initialData?: ClientRankingEntry[];
  initialStats?: RankingStats;
}

export default function ClientRanking({ 
  initialData = [], 
  initialStats 
}: ClientRankingProps) {
  const [period, setPeriod] = useState<"30" | "60" | "90">("30");
  const [sortBy, setSortBy] = useState<"appointments" | "spent" | "points">("appointments");
  const [data, setData] = useState<ClientRankingEntry[]>(initialData);
  const [stats, setStats] = useState<RankingStats | undefined>(initialStats);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchRanking() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/ranking?period=${period}&sort=${sortBy}`);
        const result = await res.json();
        setData(result.rankings || []);
        setStats(result.stats);
      } catch (error) {
        console.error("Error fetching ranking:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!initialData || initialData.length === 0) {
      fetchRanking();
    }
  }, [period, sortBy]);

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-amber-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Trophy className="h-6 w-6 text-amber-700" />;
      default:
        return null;
    }
  };

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1:
        return "border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50";
      case 2:
        return "border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50";
      case 3:
        return "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50";
      default:
        return "";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Calcular progress bar baseado no valor máximo
  const maxValue = data.length > 0 ? Math.max(...data.map(d => {
    switch (sortBy) {
      case "appointments": return d.total_completed;
      case "spent": return d.total_spent;
      case "points": return d.total_loyalty_points || 0;
      default: return 0;
    }
  })) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ranking de Clientes</h2>
          <p className="text-sm text-gray-500">
            Clientes mais fiéis e frequentes
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v: "30" | "60" | "90") => setPeriod(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v: "appointments" | "spent" | "points") => setSortBy(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="appointments">Por Atendimentos</SelectItem>
              <SelectItem value="spent">Por Gastos</SelectItem>
              <SelectItem value="points">Por Pontos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
              </div>
              <p className="mt-1 text-2xl font-bold">{stats.total_clients}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Total Atendimentos</p>
              </div>
              <p className="mt-1 text-2xl font-bold">{stats.total_appointments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Média por Cliente</p>
              </div>
              <p className="mt-1 text-2xl font-bold">{stats.avg_appointments_per_client.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Receita Total</p>
              </div>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(stats.total_revenue)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ranking List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : data.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nenhum cliente encontrado no período selecionado
            </p>
          ) : (
            <div className="space-y-4">
              {data.map((client, index) => (
                <div
                  key={client.client_id}
                  className={`rounded-lg border p-4 transition-all hover:shadow-md ${
                    getMedalColor(index + 1)
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Position and Medal */}
                    <div className="flex items-center justify-center w-12">
                      {getMedalIcon(index + 1) || (
                        <span className="text-lg font-bold text-muted-foreground">
                          #{index + 1}
                        </span>
                      )}
                    </div>

                    {/* Client Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-gray-900 truncate">
                          {client.full_name}
                        </p>
                        {index < 3 && (
                          <Badge variant="secondary" className="text-xs">
                            Top {index + 1}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {client.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Último atendimento: {formatDate(client.last_appointment)}
                      </p>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>
                            {sortBy === "appointments" && "Atendimentos"}
                            {sortBy === "spent" && "Valor gasto"}
                            {sortBy === "points" && "Pontos de fidelidade"}
                          </span>
                          <span className="font-medium">
                            {sortBy === "appointments" && client.total_completed}
                            {sortBy === "spent" && formatCurrency(client.total_spent)}
                            {sortBy === "points" && (client.total_loyalty_points || 0)} pts
                          </span>
                        </div>
                        <Progress 
                          value={
                            (sortBy === "appointments" 
                              ? client.total_completed 
                              : sortBy === "spent" 
                              ? client.total_spent 
                              : client.total_loyalty_points || 0) / maxValue * 100
                          } 
                          className="h-2"
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col items-end gap-1 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{client.total_completed}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{formatCurrency(client.total_spent)}</span>
                      </div>
                      {client.total_loyalty_points && (
                        <div className="flex items-center gap-1">
                          <Trophy className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{client.total_loyalty_points} pts</span>
                        </div>
                      )}
                      {client.avg_rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium">{client.avg_rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
