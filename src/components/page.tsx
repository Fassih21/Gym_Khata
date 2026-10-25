import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="display-num text-4xl tracking-wide">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Loading skeleton (naam purana, taake saare pages ka loading state ek jagah se badle). */
export function CenterSpinner() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-48 rounded-2xl" />
      <Skeleton className="mt-2 h-4 w-32 rounded-lg" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="mt-4 space-y-px overflow-hidden rounded-2xl border border-border bg-card">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <p className="font-semibold">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <AlertTriangle className="mx-auto size-6 text-destructive" />
      <p className="mt-2 font-semibold">Data load nahi hua</p>
      <p className="mt-1 text-sm text-muted-foreground">Internet check karein aur dobara koshish karein.</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="size-4" /> Retry
        </Button>
      )}
    </div>
  );
}
