"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, CalendarCheck, Award, Pencil } from "lucide-react";
import { toast } from "sonner";
import { safeFetch } from "@/lib/errors/client";

interface ProfileData {
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  loyalty_points: number;
  total_completed: number;
}

export default function MinhaContaClient({
  profile,
}: {
  profile: ProfileData;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone || "");

  async function handleSave() {
    setSaving(true);

    const result = await safeFetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        phone: phone || null,
      }),
    });

    setSaving(false);

    if (!result.ok) return;

    toast.success("Dados atualizados com sucesso");
    setEditing(false);
    router.refresh();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Minha Conta</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
              <Star className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{profile.loyalty_points}</p>
              <p className="text-sm text-muted-foreground">Pontos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CalendarCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{profile.total_completed}</p>
              <p className="text-sm text-muted-foreground">Atendimentos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {profile.role === "admin" ? "Admin" : "Cliente"}
              </p>
              <p className="text-sm text-muted-foreground">Status</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loyalty Quick Link */}
      {profile.loyalty_points > 0 && (
        <Card className="mt-4 border-rose-100 bg-rose-50/50">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-rose-900">
                Voce tem {profile.loyalty_points} pontos de fidelidade!
              </p>
              <p className="text-sm text-rose-700">
                Acompanhe seu historico e resgate descontos
              </p>
            </div>
            <Link href="/cliente/meus-pontos">
              <Button
                variant="outline"
                size="sm"
                className="border-rose-300 text-rose-700 hover:bg-rose-100"
              >
                Ver pontos
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dados Pessoais</CardTitle>
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3 w-3" />
              Editar
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div>
                <Label>Nome</Label>
                <Input
                  className="mt-1"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input className="mt-1" value={profile.email} disabled />
                <p className="mt-1 text-xs text-muted-foreground">
                  O email nao pode ser alterado
                </p>
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  className="mt-1"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setFullName(profile.full_name);
                    setPhone(profile.phone || "");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Nome
                </label>
                <p>{profile.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p>{profile.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Telefone
                </label>
                <p>{profile.phone || "—"}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
