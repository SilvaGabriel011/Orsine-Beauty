"use client";

import { useState } from "react";
import {
  Tag, Sparkles, Package, Plus, Check, Clock, X,
  ToggleLeft, ToggleRight, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface StoreItem {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  type: "discount" | "service" | "product";
  coin_price: number;
  metadata: Record<string, unknown>;
  stock: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface AdminRedemption {
  id: string;
  client_id: string;
  item_id: string;
  coins_spent: number;
  status: "pending" | "fulfilled" | "cancelled";
  fulfilled_at: string | null;
  notes: string | null;
  created_at: string;
  profiles: { full_name: string; email: string };
  reward_store_items: { name: string; type: string };
}

interface LojaAdminClientProps {
  items: StoreItem[];
  redemptions: AdminRedemption[];
}

const TYPE_LABELS: Record<string, string> = {
  discount: "Discount",
  service: "Service",
  product: "Product",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  discount: <Tag className="h-4 w-4" />,
  service: <Sparkles className="h-4 w-4" />,
  product: <Package className="h-4 w-4" />,
};

export function LojaAdminClient({ items: initialItems, redemptions: initialRedemptions }: LojaAdminClientProps) {
  const [items, setItems] = useState(initialItems);
  const [redemptions, setRedemptions] = useState(initialRedemptions);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    type: "discount" as "discount" | "service" | "product",
    coin_price: 100,
    stock: "" as string,
  });

  const handleCreateItem = async () => {
    if (!newItem.name || !newItem.coin_price) {
      toast.error("Fill in name and price");
      return;
    }

    try {
      const res = await fetch("/api/admin/store/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newItem.name,
          description: newItem.description,
          type: newItem.type,
          coin_price: newItem.coin_price,
          stock: newItem.stock ? parseInt(newItem.stock) : null,
        }),
      });

      if (!res.ok) {
        toast.error("Error creating item");
        return;
      }

      const data = await res.json();
      setItems((prev) => [...prev, data.item]);
      setShowCreateDialog(false);
      setNewItem({ name: "", description: "", type: "discount", coin_price: 100, stock: "" });
      toast.success("Item created successfully");
    } catch {
      toast.error("Connection error");
    }
  };

  const handleToggleItem = async (itemId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/store/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (!res.ok) {
        toast.error("Error updating item");
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, is_active: !isActive } : item
        )
      );
      toast.success(isActive ? "Item deactivated" : "Item activated");
    } catch {
      toast.error("Connection error");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/store/items/${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Error deleting item");
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== itemId));
      toast.success("Item deleted");
    } catch {
      toast.error("Connection error");
    }
  };

  const handleUpdateRedemption = async (redemptionId: string, status: "fulfilled" | "cancelled") => {
    try {
      const res = await fetch(`/api/store/redemptions/${redemptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        toast.error("Error updating");
        return;
      }

      setRedemptions((prev) =>
        prev.map((r) =>
          r.id === redemptionId
            ? { ...r, status, fulfilled_at: status === "fulfilled" ? new Date().toISOString() : r.fulfilled_at }
            : r
        )
      );
      toast.success(status === "fulfilled" ? "Marked as delivered" : "Redemption cancelled and coins refunded");
    } catch {
      toast.error("Connection error");
    }
  };

  const pendingCount = redemptions.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rewards Shop</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Shop Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. $15 discount"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={newItem.description}
                  onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Discount applicable to any service"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={newItem.type}
                  onValueChange={(v) => setNewItem((p) => ({ ...p, type: v as typeof p.type }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="service">Free service</SelectItem>
                    <SelectItem value="product">Physical product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price (coins)</Label>
                <Input
                  type="number"
                  value={newItem.coin_price}
                  onChange={(e) => setNewItem((p) => ({ ...p, coin_price: parseInt(e.target.value) || 0 }))}
                  min={1}
                />
              </div>
              <div>
                <Label>Stock (empty = unlimited)</Label>
                <Input
                  type="number"
                  value={newItem.stock}
                  onChange={(e) => setNewItem((p) => ({ ...p, stock: e.target.value }))}
                  placeholder="Unlimited"
                  min={0}
                />
              </div>
              <Button onClick={handleCreateItem} className="w-full">
                Create Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{items.length}</p>
            <p className="text-sm text-muted-foreground">Shop items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{items.filter((i) => i.is_active).length}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">Pending deliveries</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
          <TabsTrigger value="redemptions">
            Redemptions {pendingCount > 0 && <Badge className="ml-1 bg-amber-500">{pendingCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-4 space-y-3">
          {items.map((item) => (
            <Card key={item.id} className={!item.is_active ? "opacity-50" : ""}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                  {TYPE_ICONS[item.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{TYPE_LABELS[item.type]}</span>
                    <span>|</span>
                    <span>{item.coin_price} coins</span>
                    {item.stock !== null && (
                      <>
                        <span>|</span>
                        <span>Stock: {item.stock}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleItem(item.id, item.is_active)}
                  >
                    {item.is_active ? (
                      <ToggleRight className="h-5 w-5 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="redemptions" className="mt-4 space-y-3">
          {redemptions.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No redemptions recorded.</p>
          ) : (
            redemptions.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{r.reward_store_items.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.profiles.full_name} ({r.profiles.email})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.coins_spent} coins | {new Date(r.created_at).toLocaleDateString("en-AU")}
                    </p>
                  </div>
                  {r.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateRedemption(r.id, "fulfilled")}
                      >
                        <Check className="mr-1 h-3.5 w-3.5" />
                        Delivered
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateRedemption(r.id, "cancelled")}
                      >
                        <X className="mr-1 h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <Badge
                      className={
                        r.status === "fulfilled"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {r.status === "fulfilled" ? (
                        <><Check className="mr-1 h-3 w-3" /> Delivered</>
                      ) : (
                        <><X className="mr-1 h-3 w-3" /> Cancelled</>
                      )}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
