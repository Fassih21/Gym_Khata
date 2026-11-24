import { Outlet, createFileRoute } from "@tanstack/react-router";

import { MarketingLayout } from "@/components/marketing/marketing-layout";

export const Route = createFileRoute("/_marketing")({
  component: MarketingRouteLayout,
});

function MarketingRouteLayout() {
  return (
    <MarketingLayout>
      <Outlet />
    </MarketingLayout>
  );
}
