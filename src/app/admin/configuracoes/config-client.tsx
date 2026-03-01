"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function ConfigClient({
  initialSettings,
}: {
  initialSettings: Record<string, string>;
}) {
  const supabase = createClient();
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(false);

  function updateField(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setLoading(true);

    try {
      for (const [key, value] of Object.entries(settings)) {
        let jsonValue: string | number | boolean;

        // Try to parse as number or boolean
        if (value === "true" || value === "false") {
          jsonValue = value;
        } else if (!isNaN(Number(value)) && value.trim() !== "") {
          jsonValue = value;
        } else {
          jsonValue = JSON.stringify(value.replace(/^"|"$/g, ""));
        }

        await (supabase
          .from("settings") as any)
          .upsert({ key, value: jsonValue, updated_at: new Date().toISOString() });
      }

      toast.success("Configuracoes salvas!");
    } catch {
      toast.error("Erro ao salvar configuracoes");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuracoes</h1>
        <p className="text-muted-foreground">
          Configuracoes gerais do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Estudio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome do Estudio</Label>
            <Input
              value={(settings.business_name || "").replace(/^"|"$/g, "")}
              onChange={(e) => updateField("business_name", e.target.value)}
            />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input
              value={(settings.business_phone || "").replace(/^"|"$/g, "")}
              onChange={(e) => updateField("business_phone", e.target.value)}
            />
          </div>
          <div>
            <Label>Endereco</Label>
            <Input
              value={(settings.business_address || "").replace(/^"|"$/g, "")}
              onChange={(e) => updateField("business_address", e.target.value)}
            />
          </div>
          <div>
            <Label>Instagram</Label>
            <Input
              value={(settings.social_instagram || "").replace(/^"|"$/g, "")}
              onChange={(e) => updateField("social_instagram", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Politicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Horas para cancelamento (antes do atendimento)</Label>
            <Input
              type="number"
              value={settings.cancellation_policy_hours || "24"}
              onChange={(e) =>
                updateField("cancellation_policy_hours", e.target.value)
              }
            />
          </div>
          <div>
            <Label>Duracao padrao do slot (minutos)</Label>
            <Input
              type="number"
              value={settings.default_slot_duration || "40"}
              onChange={(e) =>
                updateField("default_slot_duration", e.target.value)
              }
            />
          </div>
          <div>
            <Label>Delay do alerta de feedback (minutos apos atendimento)</Label>
            <Input
              type="number"
              value={settings.feedback_delay_minutes || "60"}
              onChange={(e) =>
                updateField("feedback_delay_minutes", e.target.value)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={loading}
        className="bg-rose-600 hover:bg-rose-700"
      >
        {loading ? "Salvando..." : "Salvar Configuracoes"}
      </Button>
    </div>
  );
}
