import { Suspense } from "react";

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { getEvents } from "~/server/nostr";

import { ClientArticleFeed } from "./ClientArticleFeed";

const filter = { kinds: [30023], limit: 10 };

export async function ArticleFeed() {
  const queryClient = new QueryClient();

  // sleep for 5 seconds to simulate network latency
  // await new Promise((resolve) => setTimeout(resolve, 5000));

  await queryClient.prefetchQuery({
    queryKey: ["posts"],
    queryFn: () => getEvents(filter),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div></div>}>
        <ClientArticleFeed />
      </Suspense>
    </HydrationBoundary>
  );
}
