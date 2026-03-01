"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/lib/errors/client";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    services?: { name: string } | null;
    appointment_services?: Array<{ services: { name: string } | null }> | null;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function RescheduleModal({ 
  open, 
  onOpenChange, 
  appointment 
}: RescheduleModalProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const getServiceNames = () => {
    if (appointment.appointment_services?.length > 0) {
      return appointment.appointment_services
        .map(as => as.services?.name)
        .filter(Boolean)
        .join(", ");
    }
    return appointment.services?.name || "Serviço";
  };

  const fetchAvailability = useCallback(async () => {
    if (!selectedDate) return;

    setLoadingSlots(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const result = await safeFetch(`/api/availability?date=${dateStr}`);
      
      if (result.ok && result.data) {
        setAvailableSlots(result.data.available || []);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate && open) {
      fetchAvailability();
    }
  }, [selectedDate, open, fetchAvailability]);

  useEffect(() => {
    if (availableSlots.length > 0) {
      const slots = generateTimeSlots(availableSlots);
      setTimeSlots(slots);
    }
  }, [availableSlots]);

  const generateTimeSlots = (slots: string[]) => {
    return slots.map((time) => ({ time, available: true }));
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Selecione data e horário");
      return;
    }

    setLoading(true);

    // Calcular horário de fim (ex: +1h para exemplo)
    const [hour, minute] = selectedTime.split(":").map(Number);
    const endTime = setMinutes(setHours(selectedDate, hour + 1), minute);

    const result = await safeFetch(`/api/appointments/${appointment.id}/reschedule`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        new_date: format(selectedDate, "yyyy-MM-dd"),
        new_start_time: selectedTime,
        new_end_time: format(endTime, "HH:mm"),
      }),
    });

    setLoading(false);

    if (!result.ok) {
      if (result.error?.code === "APPT_RESCHEDULE_TOO_LATE") {
        toast.error("Não é possível reagendar com menos de 24h de antecedência");
      } else if (result.error?.code === "APPT_RESCHEDULE_TOO_SOON") {
        toast.error("O novo horário deve ter pelo menos 24h de antecedência");
      } else if (result.error?.code === "SLOT_UNAVAILABLE") {
        toast.error("Horário não está mais disponível");
      } else if (result.error?.code === "SLOT_DOUBLE_BOOKING") {
        toast.error("Este horário foi agendado por outra cliente");
      } else {
        toast.error(result.error?.message || "Erro ao reagendar");
      }
      return;
    }

    toast.success("Agendamento reagendado com sucesso!");
    onOpenChange(false);
    router.refresh();
  };

  // Desabilitar datas anteriores a hoje
  const disabledDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reagendar Agendamento</DialogTitle>
          <DialogDescription>
            Selecione uma nova data e horário para {getServiceNames()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Calendário */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Nova Data
            </Label>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={disabledDays}
                locale={ptBR}
                className="rounded-md border"
              />
            </div>
          </div>

          {/* Horários */}
          {selectedDate && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Novo Horário
              </Label>
              
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      size="sm"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className={
                        selectedTime === slot.time
                          ? "bg-rose-600 hover:bg-rose-700"
                          : !slot.available
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              )}

              {timeSlots.length > 0 && 
               timeSlots.filter(s => s.available).length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    Não há horários disponíveis nesta data
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={!selectedDate || !selectedTime || loading}
            className="bg-rose-600 hover:bg-rose-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reagendando...
              </>
            ) : (
              "Confirmar Reagendamento"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
