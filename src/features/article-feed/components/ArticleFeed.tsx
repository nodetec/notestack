import { Suspense } from "react";

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { SimplePool } from "nostr-tools/pool";

import { ClientArticleFeed } from "./ClientArticleFeed";

const relays = ["wss://relay.notestack.com"];

const pool = new SimplePool();

async function getPosts() {
  const events = await pool.querySync(relays, { kinds: [30023], limit: 10 });
  return events;
}

export async function ArticleFeed() {
  const queryClient = new QueryClient();

  // sleep for 5 seconds to simulate network latency
  // await new Promise((resolve) => setTimeout(resolve, 5000));

  await queryClient.prefetchQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div></div>}>
        <ClientArticleFeed />
      </Suspense>
    </HydrationBoundary>
  );
}
