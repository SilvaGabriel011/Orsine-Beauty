/**
 * API Route: /api/admin/ranking
 *
 * Retorna ranking de clientes com estatísticas detalhadas.
 * Filtrável por período e ordenável por diferentes métricas.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppError, withErrorHandler, requireAdmin } from "@/lib/errors";

// GET: Ranking de clientes com filtros
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "30"; // 30, 60 ou 90 dias
  const sortBy = searchParams.get("sort") || "appointments"; // appointments, spent ou points

  // Calcular data de corte baseada no período
  const daysAgo = parseInt(period);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  // Buscar clientes com estatísticas
  const { data: appointments, error: aptError } = await supabase
    .from("appointments")
    .select(`
      client_id,
      status,
      amount_paid,
      appointment_date,
      profiles(id, full_name, email, total_completed)
    `)
    .eq("status", "completed")
    .gte("appointment_date", cutoffDateStr) as { data: any[] | null; error: any };

  if (aptError) {
    throw new AppError("RES_NOT_FOUND", aptError.message);
  }

  // Processar dados manualmente
  const clientMap = new Map();
  
  appointments?.forEach((apt: any) => {
    const clientId = apt.client_id;
    if (!clientMap.has(clientId)) {
      clientMap.set(clientId, {
        client_id: clientId,
        full_name: apt.profiles?.full_name || "",
        email: apt.profiles?.email || "",
        total_completed: 0,
        total_spent: 0,
        last_appointment: apt.appointment_date,
        avg_rating: 0,
        total_all_time: apt.profiles?.total_completed || 0,
      });
    }

    const client = clientMap.get(clientId);
    client.total_completed += 1;
    client.total_spent += apt.amount_paid || 0;
    
    if (apt.appointment_date > client.last_appointment) {
      client.last_appointment = apt.appointment_date;
    }
  });

  const rankings = Array.from(clientMap.values());

  // Buscar estatísticas gerais
  const { data: statsData, error: statsError } = await supabase
    .from("appointments")
    .select("amount_paid, client_id")
    .eq("status", "completed")
    .gte("appointment_date", cutoffDateStr) as { data: any[] | null; error: any };

  if (statsError) {
    throw new AppError("RES_NOT_FOUND", statsError.message);
  }

  // Calcular estatísticas
  const uniqueClients = new Set(statsData?.map(a => a.client_id)).size;
  const totalAppointments = statsData?.length || 0;
  const totalRevenue = statsData?.reduce((sum, a) => sum + (a.amount_paid || 0), 0) || 0;
  const avgAppointmentsPerClient = uniqueClients > 0 ? totalAppointments / uniqueClients : 0;

  const stats = {
    total_clients: uniqueClients,
    total_appointments: totalAppointments,
    avg_appointments_per_client: avgAppointmentsPerClient,
    total_revenue: totalRevenue,
  };

  // Ordenar
  switch (sortBy) {
    case "spent":
      rankings.sort((a, b) => b.total_spent - a.total_spent);
      break;
    case "points":
      rankings.sort((a, b) => b.total_all_time - a.total_all_time);
      break;
    default:
      rankings.sort((a, b) => b.total_completed - a.total_completed);
  }

  // Adicionar pontos de fidelidade se disponível
  const rankingWithPoints = rankings.map((client: any) => ({
    ...client,
    total_loyalty_points: client.total_all_time * 10, // Exemplo: 10 pontos por atendimento
  }));

  return NextResponse.json({
    rankings: rankingWithPoints,
    stats,
  });
});
