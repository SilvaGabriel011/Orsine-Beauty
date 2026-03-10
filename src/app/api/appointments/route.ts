/**
 * API Route: /api/appointments
 *
 * Gerencia agendamentos (appointments) do sistema.
 *
 * GET  — Lista agendamentos (admin ve todos, cliente ve apenas os seus)
 * POST — Cria novo agendamento com validacao de conflito,
 *         integracao Google Calendar e email de confirmacao
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCalendarEvent } from "@/lib/google-calendar";
import { sendEmail, buildConfirmationEmail } from "@/lib/notifications";
import { generateCancelToken } from "@/lib/tokens";
import { AppError, withErrorHandler, requireAuth, requireAdmin, logger } from "@/lib/errors";
import { getAdelaideDateString } from "@/lib/timezone";
import { z } from "zod";

// SQL SELECT com relations: servicos, perfil cliente e servicos do agendamento
const APPOINTMENT_SELECT = `
  *,
  services(id, name, price, duration_minutes, categories(id, name)),
  profiles(id, full_name, phone, email),
  appointment_services(id, service_id, price_at_booking, duration_at_booking, services(id, name, price, duration_minutes, categories(id, name)))
`;

// Padroes de validacao Zod: UUIDs, horas (HH:MM), datas (YYYY-MM-DD)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Schema de validacao para criar agendamento: servicos, datas, horas e pagamento
const createAppointmentSchema = z.object({
  service_id: z.string().regex(uuidRegex, "service_id invalido").optional(),
  services: z.array(z.object({
    service_id: z.string().regex(uuidRegex).optional(),
    id: z.string().regex(uuidRegex).optional(),
  })).optional(),
  appointment_date: z.string().regex(dateRegex, "Formato de data invalido (YYYY-MM-DD)"),
  start_time: z.string().regex(timeRegex, "Formato de hora invalido (HH:MM)"),
  end_time: z.string().regex(timeRegex, "Formato de hora invalido (HH:MM)"),
  payment_method: z.enum(["online", "presencial"]).optional(),
  notes: z.string().max(1000).optional().nullable(),
  discount_applied: z.number().min(0).optional(),
});

// GET: Lista agendamentos do usuario (cliente ve seus, admin ve todos ou filtra por cliente)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const status = request.nextUrl.searchParams.get("status");
  const date = request.nextUrl.searchParams.get("date");
  const clientId = request.nextUrl.searchParams.get("clientId");

  // Verifica se usuario e admin - clientes nao podem acessar agendamentos alheios
  let isAdmin = false;
  try {
    await requireAdmin(supabase);
    isAdmin = true;
  } catch {
    // Nao e admin — permite acesso apenas aos seus dados
  }

  // Validacao de autorizacao: cliente tentando ver agendamento de outro usuario
  if (clientId && clientId !== user.id && !isAdmin) {
    throw new AppError("AUTH_NOT_AUTHORIZED", "Voce so pode ver seus proprios agendamentos");
  }

  // Monta query dinamicamente com filtros: status, data e cliente
  let query = (supabase
    .from("appointments") as any)
    .select(APPOINTMENT_SELECT)
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true });

  // Filtro opcional por status (confirmed, completed, cancelled)
  if (status) {
    query = query.eq("status", status);
  }

  // Filtro opcional por data do agendamento
  if (date) {
    query = query.eq("appointment_date", date);
  }

  // Controle de acesso: usuarios nao-admin ve apenas seus agendamentos
  if (!isAdmin) {
    query = query.eq("client_id", user.id);
  } else if (clientId) {
    // Admin pode filtrar por cliente especifico
    query = query.eq("client_id", clientId);
  }

  const { data, error } = (await query) as { data: any[] | null; error: any };

  if (error) {
    throw new AppError("SYS_DATABASE", error.message, error);
  }

  return NextResponse.json(data);
});

// POST: Cria novo agendamento com validacoes, verificacao de conflito e integracao Google Calendar
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  const body = await request.json();

  // Validacao do payload com Zod - garante formato correto de datas, horas e UUIDs
  const parsed = createAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || "Dados invalidos";
    throw new AppError("VAL_INVALID_FORMAT", firstError);
  }

  const {
    service_id,
    services: serviceItems,
    appointment_date,
    start_time,
    end_time,
    payment_method,
    notes,
    discount_applied,
  } = parsed.data;

  // Validacao de data: nao permite agendar em datas passadas (fuso Adelaide)
  const today = getAdelaideDateString();
  if (appointment_date < today) {
    throw new AppError("VAL_INVALID_FORMAT", "Nao e possivel agendar em datas passadas");
  }

  // Validacao logica: hora de fim deve ser posterior a hora de inicio
  if (end_time <= start_time) {
    throw new AppError("VAL_INVALID_FORMAT", "Horario de fim deve ser posterior ao horario de inicio");
  }

  // Extrai IDs de servicos: pode vir de lista (serviceItems) ou servico unico (service_id)
  let serviceIds: string[];
  if (serviceItems && serviceItems.length > 0) {
    serviceIds = serviceItems.map((s) => s.service_id || s.id).filter(Boolean) as string[];
  } else if (service_id) {
    serviceIds = [service_id];
  } else {
    throw new AppError("APPT_MISSING_SERVICES");
  }

  if (serviceIds.length === 0) {
    throw new AppError("APPT_MISSING_SERVICES");
  }

  // Busca servicos na BD: valida existencia, status ativo e coleta preco/duracao
  const { data: fetchedServices } = (await (supabase
    .from("services") as any)
    .select("id, name, price, duration_minutes")
    .in("id", serviceIds)
    .eq("is_active", true)) as { data: any[] | null };

  // Verifica se todos os servicos solicitados existem e estao ativos
  if (!fetchedServices || fetchedServices.length !== serviceIds.length) {
    throw new AppError("APPT_SERVICE_NOT_FOUND");
  }

  // Calcula totais: somatorio de precos e duracoes dos servicos
  const totalPrice = fetchedServices.reduce(
    (sum: number, s: any) => sum + s.price,
    0
  );
  const totalDuration = fetchedServices.reduce(
    (sum: number, s: any) => sum + s.duration_minutes,
    0
  );
  // Garante desconto nao negativo e nao superior ao preco total
  const safeDiscount = Math.max(0, Math.min(discount_applied || 0, totalPrice));
  const amountPaid = totalPrice - safeDiscount;

  // Verificacao de conflito em nivel aplicacao (BD exclusion constraint e a guarda principal)
  // Detecta se ja existe agendamento ativo que sobrepoe o intervalo solicitado
  const { data: conflicts } = (await (supabase
    .from("appointments") as any)
    .select("id")
    .eq("appointment_date", appointment_date)
    .neq("status", "cancelled")
    .lt("start_time", end_time)
    .gt("end_time", start_time)) as { data: any[] | null };

  if (conflicts && conflicts.length > 0) {
    throw new AppError("APPT_SLOT_TAKEN");
  }

  // Insercao do agendamento na BD - constraint de exclusao evita race conditions
  const { data: appointment, error } = (await (supabase
    .from("appointments") as any)
    .insert({
      client_id: user.id,
      service_id: serviceIds.length === 1 ? serviceIds[0] : null,
      appointment_date,
      start_time,
      end_time,
      total_duration: totalDuration,
      status: "confirmed",
      payment_status: payment_method === "online" ? "pending" : "none",
      payment_method: payment_method || "presencial",
      amount_paid: amountPaid,
      discount_applied: safeDiscount,
      notes: notes || null,
    })
    .select()
    .single()) as { data: any | null; error: any };

  if (error) {
    // Trata violacao da constraint de exclusao (duplo agendamento)
    if (error.code === "23P01" || error.message?.includes("no_overlapping_appointments")) {
      throw new AppError("APPT_SLOT_TAKEN");
    }
    throw new AppError("RES_CREATE_FAILED", error.message, error);
  }

  // Insercao na tabela junction (appointment_services) - relaciona agendamento aos servicos
  // Se falhar, faz rollback do agendamento criado (orfao na BD)
  const appointmentServicesData = fetchedServices.map((s: any) => ({
    appointment_id: appointment.id,
    service_id: s.id,
    price_at_booking: s.price,
    duration_at_booking: s.duration_minutes,
  }));

  const { error: servicesInsertError } = await (supabase.from("appointment_services") as any).insert(
    appointmentServicesData
  );

  if (servicesInsertError) {
    // Rollback: deleta agendamento orfao se falhar insercao de servicos
    await (supabase.from("appointments") as any)
      .delete()
      .eq("id", appointment.id);
    throw new AppError("RES_CREATE_FAILED", "Erro ao vincular servicos ao agendamento", servicesInsertError);
  }

  // Agendamento de notificacoes: lembretes 24h e 2h antes do agendamento
  const appointmentDateTime = new Date(
    `${appointment_date}T${start_time}`
  );
  const reminder24h = new Date(
    appointmentDateTime.getTime() - 24 * 60 * 60 * 1000
  );
  const reminder2h = new Date(
    appointmentDateTime.getTime() - 2 * 60 * 60 * 1000
  );

  // Agendamento de solicitacao de feedback: 1h apos termino do agendamento
  const appointmentEndTime = new Date(`${appointment_date}T${end_time}`);
  const feedbackTime = new Date(
    appointmentEndTime.getTime() + 1 * 60 * 60 * 1000
  );

  // Insere registros de notificacoes a serem enviadas (processadas por job assincrono)
  await (supabase.from("notifications") as any).insert([
    {
      appointment_id: appointment.id,
      channel: "email",
      type: "reminder_24h",
      scheduled_for: reminder24h.toISOString(),
    },
    {
      appointment_id: appointment.id,
      channel: "email",
      type: "reminder_2h",
      scheduled_for: reminder2h.toISOString(),
    },
    {
      appointment_id: appointment.id,
      channel: "email",
      type: "feedback_request",
      scheduled_for: feedbackTime.toISOString(),
    },
  ]);

  // Integracao Google Calendar (nao-bloqueante): cria evento no calendario
  const serviceNames = fetchedServices.map((s: any) => s.name).join(", ");
  const startISO = `${appointment_date}T${start_time}`;
  const endISO = `${appointment_date}T${end_time}`;

  try {
    const calendarEventId = await createCalendarEvent({
      summary: `Bela Orsine - ${serviceNames}`,
      description: `Cliente: ${user.user_metadata?.name || user.email}\nServicos: ${serviceNames}\nDuracao: ${totalDuration} min`,
      startDateTime: startISO,
      endDateTime: endISO,
    });

    // Armazena ID do evento Google para futuro acesso (cancelamento, atualizacao)
    if (calendarEventId) {
      await (supabase.from("appointments") as any)
        .update({ google_event_id: calendarEventId })
        .eq("id", appointment.id);
    }
  } catch (calErr) {
    // Falha nao impede agendamento - logging apenas para diagnostico
    logger.warn("Google Calendar error (non-blocking)", { code: "INT_CALENDAR_FAILED", details: calErr });
  }

  // Email de confirmacao (nao-bloqueante): notifica cliente do agendamento realizado
  try {
    const { data: clientProfile } = (await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single()) as unknown as { data: { full_name: string; email: string } | null };

    if (clientProfile?.email) {
      // Gerar token de cancelamento
      const cancelToken = await generateCancelToken({
        appointmentId: appointment.id,
        clientId: user.id,
      });

      // Formata data em portugues brasileiro para email amigavel
      const formattedDate = new Date(
        `${appointment_date}T12:00:00`
      ).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const emailData = buildConfirmationEmail({
        clientName: clientProfile.full_name || "Cliente",
        services: fetchedServices.map((s: any) => ({
          name: s.name,
          price: s.price,
          duration_minutes: s.duration_minutes,
        })),
        date: formattedDate,
        time: start_time.substring(0, 5),
        appointmentId: appointment.id,
        cancelToken,
      });

      emailData.to = clientProfile.email;
      await sendEmail(emailData);
    }
  } catch (emailErr) {
    // Falha de email nao impede agendamento - logging apenas
    logger.warn("Email error (non-blocking)", { code: "INT_EMAIL_FAILED", details: emailErr });
  }

  return NextResponse.json(appointment, { status: 201 });
});
