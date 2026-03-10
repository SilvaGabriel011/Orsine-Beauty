"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Star, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { safeFetch } from "@/lib/errors/client";
import StarRating from "@/components/reviews/StarRating";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  is_visible: boolean;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
  services: {
    id: string;
    name: string;
    categories: { id: string; name: string } | null;
  } | null;
}

interface Service {
  id: string;
  name: string;
}

interface Stats {
  total: number;
  average: number;
  pending: number;
}

export default function FeedbacksClient({
  reviews,
  services,
  stats,
}: {
  reviews: Review[];
  services: Service[];
  stats: Stats;
}) {
  const router = useRouter();
  const [filterService, setFilterService] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = reviews.filter((r) => {
    if (filterService !== "all" && r.services?.id !== filterService)
      return false;
    if (filterRating !== "all" && r.rating !== parseInt(filterRating))
      return false;
    if (filterVisibility === "visible" && !r.is_visible) return false;
    if (filterVisibility === "hidden" && r.is_visible) return false;
    return true;
  });

  async function toggleVisibility(review: Review) {
    setTogglingId(review.id);

    const result = await safeFetch(`/api/reviews/${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: !review.is_visible }),
    });

    setTogglingId(null);

    if (!result.ok) return;

    toast.success(
      review.is_visible ? "Avaliacao ocultada" : "Avaliacao publicada"
    );
    router.refresh();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Avaliacoes</h1>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.average}</p>
              <p className="text-sm text-muted-foreground">Media</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="min-w-[160px]">
            <Label>Servico</Label>
            <Select value={filterService} onValueChange={setFilterService}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[120px]">
            <Label>Nota</Label>
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {[5, 4, 3, 2, 1].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} estrela{n > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[140px]">
            <Label>Visibilidade</Label>
            <Select
              value={filterVisibility}
              onValueChange={setFilterVisibility}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="visible">Visiveis</SelectItem>
                <SelectItem value="hidden">Ocultas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Servico</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead className="max-w-[300px]">Comentario</TableHead>
                <TableHead>Visivel</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Nenhuma avaliacao encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {review.profiles?.full_name || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {review.profiles?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{review.services?.name || "—"}</p>
                        {review.services?.categories?.name && (
                          <p className="text-xs text-muted-foreground">
                            {review.services.categories.name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StarRating
                        rating={review.rating}
                        readonly
                        size="sm"
                      />
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      {review.comment ? (
                        <p className="truncate text-sm" title={review.comment}>
                          {review.comment}
                        </p>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Sem comentario
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={review.is_visible}
                        disabled={togglingId === review.id}
                        onCheckedChange={() => toggleVisibility(review)}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(review.created_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
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
