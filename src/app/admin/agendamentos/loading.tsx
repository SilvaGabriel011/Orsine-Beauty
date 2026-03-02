import { AppointmentSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-7 w-48 bg-gray-200 animate-pulse rounded" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-200 animate-pulse rounded-full" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <AppointmentSkeleton key={i} />
      ))}
    </div>
  );
}
