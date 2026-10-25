import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — GymKhata" },
      { name: "description", content: "GymKhata par sign in karein. Sirf gym owners ke liye." },
      { property: "og:title", content: "Sign in — GymKhata" },
      { property: "og:description", content: "GymKhata par sign in karein. Sirf gym owners ke liye." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in? Straight to the dashboard.
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError) {
      setSubmitting(false);
      setError(
        authError.message === "Invalid login credentials"
          ? "Email ya password ghalat hai."
          : authError.message === "Email not confirmed"
            ? "Email abhi confirm nahi hua. Support se rabta karein."
            : "Sign in nahi ho saka. Thori dair baad koshish karein.",
      );
      return;
    }
    await navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-svh md:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2.5">
          <LogoMark className="size-9 text-sidebar-foreground" />
          <span className="display-num text-3xl tracking-wide">GymKhata</span>
        </div>
        <div>
          <p className="display-num text-6xl leading-tight tracking-wide text-primary">
            Gym ka hisaab,
            <br />
            ek jagah.
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-sidebar-foreground/70">
            Members, fees, salaries aur expenses — roz ka hisaab kitab bina kisi pareeshani ke. Aap ke data
            se sirf aap ka gym dekh sakta hai.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">Sirf gym owners ke liye. Sign-up sirf management kholta hai.</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 md:hidden">
            <LogoMark className="size-8 text-foreground" />
            <span className="display-num text-2xl tracking-wide">GymKhata</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sign in karein</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Apne gym ka hisaab dekhne ke liye sign in karein.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@gym.pk"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="h-11 w-full text-base font-semibold">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            Naya gym account? Management se sign-in details hasil karein.
          </p>
        </div>
      </div>
    </div>
  );
}
