import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { addMonths, monthLabel, monthKey } from "@/lib/format";

interface MonthSelectProps {
  value: string; // YYYY-MM-01
  onChange: (key: string) => void;
  /** Months into the future the user may browse (default 0 = current month). */
  maxFuture?: number;
}

export function MonthSelect({ value, onChange, maxFuture = 0 }: MonthSelectProps) {
  const current = monthKey();
  const earliest = `${Number(current.slice(0, 4)) - 2}-01-01`;
  const canGoBack = value > earliest;
  const latest = addMonths(current, maxFuture);

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Pichla mahina"
        disabled={!canGoBack}
        onClick={() => onChange(addMonths(value, -1))}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-32 px-2 text-center text-sm font-semibold">{monthLabel(value)}</span>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Agla mahina"
        disabled={value >= latest}
        onClick={() => onChange(addMonths(value, 1))}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
