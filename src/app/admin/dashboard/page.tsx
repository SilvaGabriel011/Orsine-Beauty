/**
 * Pagina: Dashboard Administrativo
 *
 * Visao geral do negocio com metricas-chave:
 * - Numero de agendamentos (hoje, semana, mes)
 * - Numero de clientes (novos, total)
 * - Receita
 * - Avaliacoes de clientes
 * - Links rapidos para gerenciar principais areas
 *
 * Server Component que carrega dados agregados do banco de dados.
 */
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CalendarClock,
  Star,
  MessageSquare,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TopClientsCard from "@/components/admin/TopClientsCard";

export const metadata: Metadata = {
  title: "Dashboard",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-800" },
  completed: { label: "Concluido", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
  no_show: { label: "Nao compareceu", color: "bg-gray-100 text-gray-800" },
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = (await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()) as unknown as { data: { full_name: string } | null };

  const displayName =
    profile?.full_name ?? user.user_metadata?.name ?? "Admin";

  // ---------- Date helpers ----------
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    .toISOString()
    .split("T")[0];
  const tomorrowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  )
    .toISOString()
    .split("T")[0];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const weekStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay()
  )
    .toISOString()
    .split("T")[0];

  // ---------- Queries ----------
  // Today's appointments
  const { data: todayAppointments } = (await (
    supabase.from("appointments") as any
  )
    .select(
      "id, appointment_date, start_time, status, total_duration, profiles(full_name), services(name), appointment_services(id, services(name))"
    )
    .eq("appointment_date", todayStart)
    .neq("status", "cancelled")
    .order("start_time", { ascending: true })) as {
    data: any[] | null;
  };

  // This week's appointments count
  const { count: weekCount } = (await (
    supabase.from("appointments") as any
  )
    .select("id", { count: "exact", head: true })
    .gte("appointment_date", weekStart)
    .lt("appointment_date", tomorrowStart)
    .neq("status", "cancelled")) as { count: number | null };

  // This month's appointments (for revenue)
  const { data: monthAppointments } = (await (
    supabase.from("appointments") as any
  )
    .select(
      "id, status, appointment_services(price_at_booking), services(price)"
    )
    .gte("appointment_date", monthStart)
    .neq("status", "cancelled")) as {
    data: any[] | null;
  };

  // New clients this month
  const { count: newClientsCount } = (await (
    supabase.from("profiles") as any
  )
    .select("id", { count: "exact", head: true })
    .eq("role", "client")
    .gte("created_at", monthStart)) as { count: number | null };

  // Total clients
  const { count: totalClients } = (await (
    supabase.from("profiles") as any
  )
    .select("id", { count: "exact", head: true })
    .eq("role", "client")) as { count: number | null };

  // Reviews stats
  const { data: allReviews } = (await (
    supabase.from("reviews") as any
  )
    .select("rating")
  ) as { data: { rating: number }[] | null };

  const reviewCount = allReviews?.length ?? 0;
  const avgRating =
    reviewCount > 0
      ? Math.round(
          (allReviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount) *
            10
        ) / 10
      : 0;

  // ---------- Compute metrics ----------
  const todayCount = todayAppointments?.length ?? 0;
  const weeklyCount = weekCount ?? 0;

  // Monthly revenue: sum from appointment_services.price_at_booking, fallback to services.price
  let monthlyRevenue = 0;
  if (monthAppointments) {
    for (const apt of monthAppointments) {
      if (
        apt.appointment_services &&
        apt.appointment_services.length > 0
      ) {
        for (const as_ of apt.appointment_services) {
          monthlyRevenue += Number(as_.price_at_booking) || 0;
        }
      } else if (apt.services?.price) {
        monthlyRevenue += Number(apt.services.price) || 0;
      }
    }
  }

  const monthlyAppointmentCount = monthAppointments?.length ?? 0;
  const completedThisMonth =
    monthAppointments?.filter((a: any) => a.status === "completed").length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600">Bem-vinda, {displayName}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Hoje
            </CardTitle>
            <CalendarDays className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {todayCount}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              agendamento{todayCount !== 1 ? "s" : ""} para hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Esta Semana
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {weeklyCount}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              agendamentos na semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Receita do Mes
            </CardTitle>
            <DollarSign className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(monthlyRevenue)}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {monthlyAppointmentCount} agendamento
              {monthlyAppointmentCount !== 1 ? "s" : ""} /{" "}
              {completedThisMonth} concluido
              {completedThisMonth !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clientes
            </CardTitle>
            <Users className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totalClients ?? 0}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {newClientsCount ?? 0} novo
              {(newClientsCount ?? 0) !== 1 ? "s" : ""} este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avaliacao Media
            </CardTitle>
            <Star className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {avgRating > 0 ? `${avgRating} / 5` : "—"}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {reviewCount} avaliacao{reviewCount !== 1 ? "oes" : ""} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avaliacoes
            </CardTitle>
            <MessageSquare className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {reviewCount}
            </div>
            <Link
              href="/admin/feedbacks"
              className="mt-1 inline-block text-xs text-rose-600 hover:underline"
            >
              Ver todas as avaliacoes →
            </Link>
          </CardContent>
        </Card>
        <TopClientsCard />
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Agenda de Hoje
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <Link href="/admin/agendamentos">
            <Button variant="outline" size="sm" className="gap-1">
              <CalendarClock className="h-4 w-4" />
              Ver todos
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {todayCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarDays className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">
                Nenhum agendamento para hoje
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments!.map((apt: any) => {
                const status = statusMap[apt.status] || statusMap.pending;
                // Build service names list
                const serviceNames: string[] = [];
                if (
                  apt.appointment_services &&
                  apt.appointment_services.length > 0
                ) {
                  for (const as_ of apt.appointment_services) {
                    if (as_.services?.name) serviceNames.push(as_.services.name);
                  }
                } else if (apt.services?.name) {
                  serviceNames.push(apt.services.name);
                }

                return (
                  <div
                    key={apt.id}
                    className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                      <Clock className="h-4 w-4" />
                      <span className="mt-0.5 text-xs font-bold">
                        {formatTime(
                          `${apt.appointment_date}T${apt.start_time}`
                        )}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {apt.profiles?.full_name || "Cliente"}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {serviceNames.length > 0
                          ? serviceNames.join(", ")
                          : "Servico"}
                        {apt.total_duration
                          ? ` · ${apt.total_duration} min`
                          : ""}
                      </p>
                    </div>
                    <Badge className={`${status.color} text-xs`}>
                      {status.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
