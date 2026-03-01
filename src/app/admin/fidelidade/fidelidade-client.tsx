"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Award, Plus, Gift, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { safeFetch } from "@/lib/errors/client";

interface LoyaltyRule {
  id: string;
  name: string;
  type: "earn" | "redeem";
  points_per_visit: number;
  points_threshold: number;
  discount_value: number;
  discount_percent: number;
  is_active: boolean;
  min_amount?: number;
}

interface TopClient {
  id: string;
  full_name: string;
  loyalty_points: number;
  total_completed: number;
}

export default function FidelidadeClient({
  rules,
  topClients,
  totalPointsActive,
}: {
  rules: LoyaltyRule[];
  topClients: TopClient[];
  totalPointsActive: number;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formType, setFormType] = useState<"earn" | "redeem">("earn");
  const [formName, setFormName] = useState("");
  const [formPointsPerVisit, setFormPointsPerVisit] = useState("1");
  const [formMinAmount, setFormMinAmount] = useState("10");
  const [formPointsThreshold, setFormPointsThreshold] = useState("100");
  const [formDiscountValue, setFormDiscountValue] = useState("10");

  function resetForm() {
    setFormType("earn");
    setFormName("");
    setFormPointsPerVisit("1");
    setFormMinAmount("10");
    setFormPointsThreshold("100");
    setFormDiscountValue("10");
  }

  async function handleSave() {
    if (!formName.trim()) {
      toast.error("Nome e obrigatorio");
      return;
    }

    setSaving(true);

    const body: any = {
      name: formName,
      type: formType,
      is_active: true,
    };

    if (formType === "earn") {
      body.points_per_visit = parseInt(formPointsPerVisit) || 1;
      body.min_amount = parseInt(formMinAmount) || 10;
    } else {
      body.points_threshold = parseInt(formPointsThreshold) || 100;
      body.discount_value = parseFloat(formDiscountValue) || 10;
    }

    const result = await safeFetch("/api/loyalty/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (!result.ok) return;

    toast.success("Regra criada com sucesso");
    setDialogOpen(false);
    resetForm();
    router.refresh();
  }

  async function toggleActive(rule: LoyaltyRule) {
    const result = await safeFetch(`/api/loyalty/rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !rule.is_active }),
    });

    if (!result.ok) return;

    toast.success(
      rule.is_active ? "Regra desativada" : "Regra ativada"
    );
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await safeFetch(`/api/loyalty/rules/${id}`, {
      method: "DELETE",
    });

    if (!result.ok) return;

    toast.success("Regra removida");
    router.refresh();
  }

  const earnRules = rules.filter((r) => r.type === "earn");
  const redeemRules = rules.filter((r) => r.type === "redeem");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Programa de Fidelidade</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 bg-rose-600 text-white hover:bg-rose-700"
              onClick={resetForm}
            >
              <Plus className="h-4 w-4" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Regra de Fidelidade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={formType}
                  onValueChange={(v) => setFormType(v as "earn" | "redeem")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earn">Ganhar pontos</SelectItem>
                    <SelectItem value="redeem">Resgatar desconto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nome da regra</Label>
                <Input
                  className="mt-1"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={
                    formType === "earn"
                      ? "Ex: 1 ponto a cada R$10"
                      : "Ex: 100 pontos = R$10 de desconto"
                  }
                />
              </div>
              {formType === "earn" ? (
                <>
                  <div>
                    <Label>Pontos por unidade</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      min="1"
                      value={formPointsPerVisit}
                      onChange={(e) => setFormPointsPerVisit(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Valor da unidade (R$)</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      min="1"
                      value={formMinAmount}
                      onChange={(e) => setFormMinAmount(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cliente ganha {formPointsPerVisit || 1} ponto(s) a cada R$
                      {formMinAmount || 10} gastos
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Pontos necessarios</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      min="1"
                      value={formPointsThreshold}
                      onChange={(e) => setFormPointsThreshold(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Valor do desconto (R$)</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      min="1"
                      step="0.01"
                      value={formDiscountValue}
                      onChange={(e) => setFormDiscountValue(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formPointsThreshold || 100} pontos = R$
                      {formDiscountValue || 10} de desconto
                    </p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
              <Award className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rules.length}</p>
              <p className="text-sm text-muted-foreground">Regras</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPointsActive}</p>
              <p className="text-sm text-muted-foreground">Pontos ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Gift className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{redeemRules.length}</p>
              <p className="text-sm text-muted-foreground">Opcoes de resgate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earn Rules */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Regras de Ganho</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Pontos</TableHead>
                <TableHead>A cada</TableHead>
                <TableHead>Ativa</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {earnRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center">
                    Nenhuma regra de ganho
                  </TableCell>
                </TableRow>
              ) : (
                earnRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{rule.points_per_visit} pt(s)</TableCell>
                    <TableCell>R$ {rule.min_amount || 10}</TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => toggleActive(rule)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(rule.id)}
                      >
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Redeem Rules */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Regras de Resgate</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Pontos necessarios</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Ativa</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {redeemRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center">
                    Nenhuma regra de resgate
                  </TableCell>
                </TableRow>
              ) : (
                redeemRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{rule.points_threshold} pts</TableCell>
                    <TableCell>R$ {rule.discount_value?.toFixed(2)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => toggleActive(rule)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(rule.id)}
                      >
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Clients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Clientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Pontos</TableHead>
                <TableHead>Atendimentos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center">
                    Nenhum cliente ainda
                  </TableCell>
                </TableRow>
              ) : (
                topClients.map((client, i) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Badge
                        className={
                          i === 0
                            ? "bg-yellow-100 text-yellow-800"
                            : i === 1
                              ? "bg-gray-100 text-gray-800"
                              : i === 2
                                ? "bg-orange-100 text-orange-800"
                                : "bg-white text-gray-600"
                        }
                      >
                        {i + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {client.full_name}
                    </TableCell>
                    <TableCell>{client.loyalty_points} pts</TableCell>
                    <TableCell>{client.total_completed}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
