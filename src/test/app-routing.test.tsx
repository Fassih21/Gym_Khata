import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

  it.each([
    ["/", "/_marketing/"],
    ["/features", "/_marketing/features"],
    ["/pricing", "/_marketing/pricing"],
    ["/about", "/_marketing/about"],
    ["/contact", "/_marketing/contact"],
    ["/faq", "/_marketing/faq"],
  ])("matches public marketing route %s", (path, expectedRouteId) => {
    const matches = router.matchRoutes(path);

    expect(matches.at(-1)?.routeId).toBe(expectedRouteId);
  });

  it.each([
    ["/login", "/login"],
    ["/dashboard", "/_authenticated/dashboard"],
    ["/members", "/_authenticated/members"],
    ["/fees", "/_authenticated/fees"],
    ["/attendance", "/_authenticated/attendance"],
    ["/admin", "/admin/"],
  ])("keeps existing app route %s registered", (path, expectedRouteId) => {
    const matches = router.matchRoutes(path);

    expect(matches.at(-1)?.routeId).toBe(expectedRouteId);
  });

  it("does not fall back to the root route for the marketing home page", () => {
    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
