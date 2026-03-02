import { TableSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 p-4">
      <div className="h-7 w-40 bg-gray-200 animate-pulse rounded" />
      <TableSkeleton rows={10} cols={4} />
    </div>
  );
}
