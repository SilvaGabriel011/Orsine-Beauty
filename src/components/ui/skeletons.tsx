import { Skeleton } from "@/components/ui/skeleton";

// Skeleton de card genérico (título + texto + badge)
export function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2 mb-4" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
}

// Skeleton de agendamento (card com avatar + info)
export function AppointmentSkeleton() {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

// Skeleton de lista de serviços (3 itens)
export function ServiceListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-white p-4 shadow-sm flex gap-3">
          <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton do dashboard admin (KPI cards)
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-4 shadow-sm">
            <Skeleton className="h-3 w-2/3 mb-2" />
            <Skeleton className="h-7 w-1/2 mb-1" />
            <Skeleton className="h-2 w-1/3" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <Skeleton className="h-4 w-1/4 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <AppointmentSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton do hub de jogos
export function GameHubSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border p-6 text-center space-y-3">
        <Skeleton className="h-6 w-1/2 mx-auto" />
        <Skeleton className="h-12 w-36 mx-auto rounded-full" />
        <div className="flex justify-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-4 text-center">
            <Skeleton className="h-14 w-14 rounded-xl mx-auto mb-2" />
            <Skeleton className="h-4 w-3/4 mx-auto mb-1" />
            <Skeleton className="h-3 w-1/2 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton de tabela (usado em ranking, admin)
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="border-b p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-3/4" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b last:border-0 p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-3 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
