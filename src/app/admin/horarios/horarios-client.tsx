"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface WorkingHour {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface BlockedSlot {
  id: string;
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

export function HorariosClient({
  initialHours,
  initialBlocked,
}: {
  initialHours: WorkingHour[];
  initialBlocked: BlockedSlot[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [openBlock, setOpenBlock] = useState(false);
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function toggleDay(hour: WorkingHour) {
    const { error } = await (supabase
      .from("working_hours") as any)
      .update({ is_active: !hour.is_active })
      .eq("id", hour.id);

    if (error) {
      toast.error("Error updating");
      return;
    }

    toast.success(
      `${dayNames[hour.day_of_week]} ${!hour.is_active ? "enabled" : "disabled"}`
    );
    router.refresh();
  }

  async function updateTime(
    hour: WorkingHour,
    field: "start_time" | "end_time",
    value: string
  ) {
    const { error } = await (supabase
      .from("working_hours") as any)
      .update({ [field]: value })
      .eq("id", hour.id);

    if (error) {
      toast.error("Error updating schedule");
      return;
    }

    router.refresh();
  }

  async function addBlock(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await (supabase.from("blocked_slots") as any).insert({
      block_date: blockDate,
      reason: blockReason || null,
    });

    if (error) {
      toast.error("Error blocking date");
    } else {
      toast.success("Date blocked!");
      setOpenBlock(false);
      setBlockDate("");
      setBlockReason("");
      router.refresh();
    }

    setLoading(false);
  }

  async function removeBlock(id: string) {
    const { error } = await (supabase
      .from("blocked_slots") as any)
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error removing block");
      return;
    }

    toast.success("Block removed!");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Working Hours</h1>
        <p className="text-muted-foreground">
          Set up working days and hours
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {initialHours.map((hour) => (
              <div
                key={hour.id}
                className="flex items-center gap-4 py-2 border-b last:border-0"
              >
                <div className="w-36 font-medium">
                  {dayNames[hour.day_of_week]}
                </div>
                <Button
                  variant={hour.is_active ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDay(hour)}
                  className={hour.is_active ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {hour.is_active ? "Open" : "Closed"}
                </Button>
                {hour.is_active && (
                  <>
                    <Input
                      type="time"
                      defaultValue={hour.start_time}
                      className="w-32"
                      onBlur={(e) =>
                        updateTime(hour, "start_time", e.target.value)
                      }
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      defaultValue={hour.end_time}
                      className="w-32"
                      onBlur={(e) =>
                        updateTime(hour, "end_time", e.target.value)
                      }
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Blocked Dates</CardTitle>
          <Dialog open={openBlock} onOpenChange={setOpenBlock}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Block Date
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Block Date</DialogTitle>
              </DialogHeader>
              <form onSubmit={addBlock} className="space-y-4">
                <div>
                  <Label htmlFor="block-date">Date</Label>
                  <Input
                    id="block-date"
                    type="date"
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="block-reason">Reason (optional)</Label>
                  <Input
                    id="block-reason"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="e.g. Holiday, Vacation"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-rose-600 hover:bg-rose-700"
                >
                  {loading ? "Saving..." : "Block"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {initialBlocked.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              No blocked dates
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialBlocked.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell>
                      {new Date(block.block_date + "T12:00:00").toLocaleDateString(
                        "en-AU"
                      )}
                    </TableCell>
                    <TableCell>
                      {block.reason || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBlock(block.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
