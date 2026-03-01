"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { safeFetch } from "@/lib/errors/client";
import ImageUpload from "@/components/admin/ImageUpload";

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category_id: string | null;
  is_active: boolean;
  sort_order: number;
  categories: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

export default function PortfolioClient({
  items,
  categories,
}: {
  items: PortfolioItem[];
  categories: Category[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  function resetForm() {
    setTitle("");
    setDescription("");
    setImageUrl("");
    setCategoryId("");
    setSortOrder("0");
    setEditingId(null);
  }

  function openEdit(item: PortfolioItem) {
    setTitle(item.title);
    setDescription(item.description || "");
    setImageUrl(item.image_url);
    setCategoryId(item.category_id || "");
    setSortOrder(String(item.sort_order));
    setEditingId(item.id);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!title.trim() || !imageUrl) {
      toast.error("Titulo e imagem sao obrigatorios");
      return;
    }

    setSaving(true);

    const body: any = {
      title,
      description: description || null,
      image_url: imageUrl,
      category_id: categoryId || null,
      sort_order: parseInt(sortOrder) || 0,
    };

    const url = editingId
      ? `/api/portfolio/${editingId}`
      : "/api/portfolio";
    const method = editingId ? "PATCH" : "POST";

    const result = await safeFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (!result.ok) return;

    toast.success(editingId ? "Foto atualizada" : "Foto adicionada");
    setDialogOpen(false);
    resetForm();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta foto do portfolio?")) return;

    const result = await safeFetch(`/api/portfolio/${id}`, { method: "DELETE" });

    if (!result.ok) return;

    toast.success("Foto removida");
    router.refresh();
  }

  async function toggleActive(item: PortfolioItem) {
    const result = await safeFetch(`/api/portfolio/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !item.is_active }),
    });

    if (!result.ok) return;

    toast.success(item.is_active ? "Foto ocultada" : "Foto visivel");
    router.refresh();
  }

  const filtered =
    filterCategory === "all"
      ? items
      : items.filter((i) => i.category_id === filterCategory);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <Button
          className="gap-2 bg-rose-600 text-white hover:bg-rose-700"
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nova Foto
        </Button>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          Nenhuma foto no portfolio.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className={`overflow-hidden ${!item.is_active ? "opacity-50" : ""}`}
            >
              <div className="relative aspect-square">
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    {item.categories?.name && (
                      <p className="text-xs text-muted-foreground">
                        {item.categories.name}
                      </p>
                    )}
                    {item.description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={() => toggleActive(item)}
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(item)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Foto" : "Nova Foto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ImageUpload
              bucket="portfolio"
              currentUrl={imageUrl}
              onUpload={(url) => setImageUrl(url)}
              onRemove={() => setImageUrl("")}
            />
            <div>
              <Label>Titulo</Label>
              <Input
                className="mt-1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Design de sobrancelha fio a fio"
              />
            </div>
            <div>
              <Label>Descricao (opcional)</Label>
              <Textarea
                className="mt-1"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ordem</Label>
              <Input
                className="mt-1"
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
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
  );
}
