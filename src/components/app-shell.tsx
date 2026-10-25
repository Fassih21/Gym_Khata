import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarCheck2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Moon,
  ReceiptText,
  Settings,
  Sun,
  Users,
  UserCog,
  Wallet,
} from "lucide-react";
import { MotionConfig, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { LogoMark } from "@/components/logo";
import { SubscriptionBlockedScreen } from "@/components/subscription-blocked-screen";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useGym } from "@/hooks/use-gym";
import { signOutEverywhere } from "@/lib/auth-helpers";
import { cn } from "@/lib/utils";

import type { QueryClient } from "@tanstack/react-query";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/members", label: "Members", icon: Users },
  { to: "/fees", label: "Fees", icon: ReceiptText },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck2 },
] as const;

const NAV_MORE = [
  { to: "/employees", label: "Employees", icon: UserCog },
  { to: "/expenses", label: "Expenses", icon: Wallet },
  { to: "/reports", label: "Reports", icon: ClipboardList },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const ALL_NAV = [...NAV, ...NAV_MORE];

export const MOBILE_BOTTOM_NAV = NAV;

/** Desktop: upar horizontal pill navigation; active pill spring se slide karti hai. */
function PillNav({ pathname }: { pathname: string }) {
  return (
    <nav className="no-scrollbar flex min-w-0 items-center gap-0.5 overflow-x-auto rounded-full border border-border bg-secondary/70 p-1">
      {ALL_NAV.map((item) => {
        const active = pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 rounded-full border border-border bg-card shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <item.icon className="relative size-4" />
            <span className={cn("relative", !active && "hidden lg:inline")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("gymkhata-theme", dark ? "dark" : "light");
    } catch {
      /* private mode */
    }
  }, [dark]);
  return (
    <Button variant="ghost" size="icon" aria-label="Theme badlein" onClick={() => setDark((d) => !d)}>
      {dark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
    </Button>
  );
}

export function AppShell({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
  const { state, gym } = useGym();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (state.phase === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <LogoMark className="size-10 animate-pulse text-foreground" />
      </div>
    );
  }

  if (state.phase === "no-gym") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          Ye account kisi gym se linked nahi hai. Support se rabta karein.
        </p>
        <Button variant="outline" onClick={() => void signOutEverywhere(queryClient)}>
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>
    );
  }

  if (state.phase === "suspended" || state.phase === "expired") {
    return <SubscriptionBlockedScreen reason={state.phase} />;
  }

  const gymName = gym?.name ?? "";

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-svh bg-background">
        {/* Top bar: logo, pill nav (desktop), gym + theme */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 md:h-16 md:px-6">
            <Link to="/dashboard" className="flex shrink-0 items-center gap-2">
              <LogoMark className="size-8 text-foreground" />
              <span className="display-num text-2xl tracking-wide">GymKhata</span>
            </Link>
            <div className="hidden min-w-0 flex-1 justify-center md:flex">
              <PillNav pathname={pathname} />
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
              <span className="hidden max-w-40 truncate rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold 2xl:block">
                {gymName}
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 md:px-6 md:pb-12 md:pt-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          {MOBILE_BOTTOM_NAV.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-dot"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-muted-foreground">
                <MoreHorizontal className="size-5" />
                More
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl pb-8">
              <SheetTitle>{gymName || "Zyada options"}</SheetTitle>
              <div className="grid grid-cols-2 gap-2 pt-2">
                {NAV_MORE.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex min-h-12 items-center gap-3 rounded-2xl border border-border px-3 text-sm font-medium transition-colors hover:bg-accent/50"
                  >
                    <item.icon className="size-4.5 text-primary" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </MotionConfig>
  );
}
