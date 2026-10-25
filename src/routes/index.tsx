import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { LogoMark } from "@/components/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GymKhata — Gym ka hisaab, ek jagah" },
      { name: "description", content: "GymKhata par sign in karein aur apne gym ka hisaab dekhen." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: "/dashboard", replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <LogoMark className="size-12 animate-pulse text-foreground" />
    </div>
  );
}
