import { cn } from "@/lib/utils";

/** GymKhata wordmark: ledger tile with a saffron dumbbell mark. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-8 shrink-0", className)} aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="9" fill="currentColor" />
      {/* dumbbell */}
      <rect x="7" y="18.4" width="26" height="3.2" rx="1.6" fill="var(--brand)" />
      <rect x="10" y="13" width="4" height="14" rx="2" fill="var(--brand)" />
      <rect x="26" y="13" width="4" height="14" rx="2" fill="var(--brand)" />
      <rect x="6.5" y="15.5" width="2.4" height="9" rx="1.2" fill="var(--brand)" opacity="0.55" />
      <rect x="31.1" y="15.5" width="2.4" height="9" rx="1.2" fill="var(--brand)" opacity="0.55" />
      {/* ledger line */}
      <rect x="14" y="30" width="12" height="2" rx="1" fill="var(--brand)" opacity="0.45" />
    </svg>
  );
}

export function Wordmark({ className, tileClassName }: { className?: string; tileClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={cn("text-foreground", tileClassName)} />
      <span className="display-num text-2xl tracking-wide">GymKhata</span>
    </span>
  );
}
