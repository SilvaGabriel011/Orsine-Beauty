"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { toast } from "sonner";
import { safeFetch } from "@/lib/errors/client";
import Image from "next/image";
import ImageUpload from "@/components/admin/ImageUpload";

interface Service {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  categories: { id: string; name: string; slug: string } | null;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export function ServicesClient({
  initialServices,
  categories,
}: {
  initialServices: Service[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("40");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredServices =
    filterCategory === "all"
      ? initialServices
      : initialServices.filter((s) => s.category_id === filterCategory);

  function resetForm() {
    setCategoryId("");
    setName("");
    setDescription("");
    setPrice("");
    setDuration("40");
    setImageUrl(null);
    setEditing(null);
  }

  function openEdit(svc: Service) {
    setEditing(svc);
    setCategoryId(svc.category_id);
    setName(svc.name);
    setDescription(svc.description || "");
    setPrice(svc.price.toString());
    setDuration(svc.duration_minutes.toString());
    setImageUrl(svc.image_url);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const url = editing ? `/api/services/${editing.id}` : "/api/services";
    const method = editing ? "PATCH" : "POST";

    const result = await safeFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: categoryId,
        name,
        description,
        price: parseFloat(price),
        duration_minutes: parseInt(duration),
        image_url: imageUrl,
      }),
    });

    setLoading(false);

    if (!result.ok) return;

    toast.success(editing ? "Service updated!" : "Service created!");
    setOpen(false);
    resetForm();
    router.refresh();
  }

  async function handleToggle(svc: Service) {
    const result = await safeFetch(`/api/services/${svc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !svc.is_active }),
    });

    if (!result.ok) return;

    toast.success(
      svc.is_active ? "Service deactivated" : "Service activated"
    );
    router.refresh();
  }

  function formatPrice(value: number) {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(value);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground">
            Manage services by category
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-rose-600 hover:bg-rose-700">
              <Plus className="mr-2 h-4 w-4" />
              New Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Service" : "New Service"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="svc-name">Name</Label>
                <Input
                  id="svc-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eyebrow Design"
                  required
                />
              </div>
              <div>
                <Label htmlFor="svc-desc">Description</Label>
                <Textarea
                  id="svc-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Service description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="svc-price">Price (AUD)</Label>
                  <Input
                    id="svc-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="80.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="svc-duration">Duration (min)</Label>
                  <Input
                    id="svc-duration"
                    type="number"
                    min="10"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Image</Label>
                <ImageUpload
                  bucket="services"
                  currentUrl={imageUrl}
                  onUpload={(url) => setImageUrl(url)}
                  onRemove={() => setImageUrl(null)}
                  className="mt-1"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-700"
              >
                {loading ? "Saving..." : "Save"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No services found
                </TableCell>
              </TableRow>
            ) : (
              filteredServices.map((svc) => (
                <TableRow key={svc.id}>
                  <TableCell>
                    {svc.image_url ? (
                      <Image
                        src={svc.image_url}
                        alt={svc.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-rose-50 text-sm font-bold text-rose-300">
                        {svc.name.charAt(0)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{svc.name}</TableCell>
                  <TableCell>{svc.categories?.name || "-"}</TableCell>
                  <TableCell>{formatPrice(svc.price)}</TableCell>
                  <TableCell>{svc.duration_minutes} min</TableCell>
                  <TableCell>
                    <Badge
                      variant={svc.is_active ? "default" : "secondary"}
                      className={
                        svc.is_active ? "bg-green-100 text-green-800" : ""
                      }
                    >
                      {svc.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <IconButton
                        variant="ghost"
                        size="icon"
                        tooltip="Edit"
                        onClick={() => openEdit(svc)}
                      >
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        size="icon"
                        tooltip="Delete"
                        onClick={() => handleToggle(svc)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
