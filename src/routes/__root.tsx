import { QueryClientProvider } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { LogoMark, Wordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

const FONT_LINKS = [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" as const },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@400;500;600;700;800&display=swap",
  },
];

function NotFoundComponent() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <LogoMark className="size-12 text-foreground" />
      <p className="display-num mt-6 text-7xl tracking-wide text-primary">404</p>
      <h1 className="mt-2 text-xl font-bold">Ye page nahi mila</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Lagta hai ye page gym se bahar nikal gaya hai. Chaliye wapis hisaab kitab par chalein.
      </p>
      <Link to="/dashboard" className="mt-8">
        <Button size="lg" className="h-12 px-6 text-base font-semibold">
          Back to dashboard
        </Button>
      </Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <LogoMark className="size-12 text-foreground" />
      <h1 className="display-num mt-6 text-4xl tracking-wide">Kuch ghalat ho gaya</h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        Page load nahi hua. Dobara koshish karein ya dashboard par wapi jayen.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          size="lg"
          className="h-12 px-6 text-base font-semibold"
        >
          Try again
        </Button>
        <Link to="/dashboard">
          <Button variant="outline" size="lg" className="h-12 px-6 text-base">
            Back to dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: import("@tanstack/react-query").QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GymKhata — Gym ka hisaab, ek jagah" },
      {
        name: "description",
        content: "GymKhata: Pakistani gyms ke liye members, fees, salaries aur expenses ka poora hisaab.",
      },
      { property: "og:title", content: "GymKhata — Gym ka hisaab, ek jagah" },
      {
        property: "og:description",
        content: "GymKhata: Pakistani gyms ke liye members, fees, salaries aur expenses ka poora hisaab.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      ...FONT_LINKS,
      
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// Applies the saved theme before paint to avoid a light/dark flash.
const themeScript = `try{var t=localStorage.getItem("gymkhata-theme");if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script>{themeScript}</script>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    let lastUserId: string | undefined;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") lastUserId = session?.user?.id;
      if (event === "SIGNED_OUT") {
        lastUserId = undefined;
        queryClient.clear();
        void router.navigate({ to: "/login", replace: true });
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Tab focus par SIGNED_IN dobara fire hota hai: same user ho to cache mat toro
        if (event === "SIGNED_IN" && session?.user?.id === lastUserId) return;
        lastUserId = session?.user?.id;
        void router.invalidate();
        queryClient.invalidateQueries();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}

// Keep the wordmark import used for potential future shell use.
void Wordmark;
