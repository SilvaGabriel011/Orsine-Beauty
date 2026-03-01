"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Search, Award, Trophy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { safeFetch } from "@/lib/errors/client";
import ClientRanking from "@/components/admin/ClientRanking";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  loyalty_points: number;
  total_completed: number;
  created_at: string;
}

export default function ClientesClient({
  clients,
}: {
  clients: Client[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [adjustDialog, setAdjustDialog] = useState<Client | null>(null);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const filtered = clients.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  async function handleAdjust() {
    if (!adjustDialog || !adjustPoints) return;

    const pts = parseInt(adjustPoints);
    if (isNaN(pts) || pts === 0) {
      toast.error("Insira um valor valido (diferente de zero)");
      return;
    }

    setAdjusting(true);

    const result = await safeFetch("/api/loyalty/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: adjustDialog.id,
        points: pts,
        description: adjustDescription || undefined,
      }),
    });

    setAdjusting(false);

    if (!result.ok) return;

    toast.success(
      pts > 0
        ? `+${pts} pontos adicionados`
        : `${pts} pontos removidos`
    );
    setAdjustDialog(null);
    setAdjustPoints("");
    setAdjustDescription("");
    router.refresh();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Clientes</h1>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Lista de Clientes</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{clients.length}</p>
              <p className="text-sm text-muted-foreground">Total de clientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {clients.reduce(
                  (sum, c) => sum + (c.total_completed || 0),
                  0
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                Total atendimentos
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
              <Award className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {clients.reduce(
                  (sum, c) => sum + (c.loyalty_points || 0),
                  0
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                Pontos em circulacao
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar por nome, email ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Pontos</TableHead>
                <TableHead>Atendimentos</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.full_name}
                    </TableCell>
                    <TableCell className="text-sm">{client.email}</TableCell>
                    <TableCell className="text-sm">
                      {client.phone || "—"}
                    </TableCell>
                    <TableCell>
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                        {client.loyalty_points} pts
                      </span>
                    </TableCell>
                    <TableCell>{client.total_completed}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(client.created_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAdjustDialog(client)}
                      >
                        Ajustar pontos
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Adjust Points Dialog */}
      <Dialog
        open={!!adjustDialog}
        onOpenChange={(open) => {
          if (!open) setAdjustDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Ajustar pontos — {adjustDialog?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Saldo atual:{" "}
              <strong>{adjustDialog?.loyalty_points || 0} pontos</strong>
            </p>
            <div>
              <Label>Pontos (positivo para adicionar, negativo para remover)</Label>
              <Input
                className="mt-1"
                type="number"
                value={adjustPoints}
                onChange={(e) => setAdjustPoints(e.target.value)}
                placeholder="Ex: 50 ou -20"
              />
            </div>
            <div>
              <Label>Motivo (opcional)</Label>
              <Input
                className="mt-1"
                value={adjustDescription}
                onChange={(e) => setAdjustDescription(e.target.value)}
                placeholder="Ex: Bonus de fidelidade"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAdjust}
              disabled={adjusting}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {adjusting ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="ranking">
          <ClientRanking />
        </TabsContent>
      </Tabs>
    </div>
  );
}
