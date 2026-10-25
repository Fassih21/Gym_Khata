import { createFileRoute } from "@tanstack/react-router";

// Sab admin endpoints: /api/admin/<action>. Handler ka pehla kaam requireAdmin (actions.server.ts).
const handle = async ({ request, params }: { request: Request; params: { action: string } }) => {
  const { handleAction } = await import("@/admin-server/actions.server");
  return handleAction(params.action, request);
};

export const Route = createFileRoute("/api/admin/$action")({
  server: { handlers: { GET: handle, POST: handle, PUT: handle, PATCH: handle, DELETE: handle } },
});
