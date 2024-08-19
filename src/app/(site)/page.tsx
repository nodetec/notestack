import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { ArticleFeed } from "~/features/article-feed";
import { SimplePool } from "nostr-tools/pool";

const relays = ["wss://relay.notestack.com"];

const pool = new SimplePool();

async function getPosts() {
  const events = await pool.querySync(relays, { kinds: [30023], limit: 10 });
  return events;
}

export default async function Home() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
  });

  return (
    <main className="grow bg-secondary p-2 sm:rounded-lg sm:p-10 sm:shadow-sm sm:ring-1 sm:ring-zinc-950/5 dark:sm:ring-white/10">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ArticleFeed />
      </HydrationBoundary>
    </main>
  );
}
