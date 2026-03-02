import { AppointmentSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 p-4">
      <div className="h-7 w-48 bg-gray-200 animate-pulse rounded" />
      {Array.from({ length: 4 }).map((_, i) => (
        <AppointmentSkeleton key={i} />
      ))}
    </div>
  );
}
