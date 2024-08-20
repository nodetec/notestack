"use client";

import { useQuery } from "@tanstack/react-query";
import { getPosts } from "~/lib/nostr";
import { useAppState } from "~/store";

import { ArticleCard } from "./ArticleCard";

export function ClientArticleFeed() {
  const pool = useAppState((state) => state.pool);
  const relays = useAppState((state) => state.relays);

  const { data } = useQuery({
    queryKey: ["posts"],
    refetchOnWindowFocus: false, // Disable refetching on window focus for now
    queryFn: () => getPosts(pool, relays),
  });

  return (
    <div className="min-w-3xl mx-auto mt-12 flex w-full max-w-3xl flex-col items-center gap-y-8">
      {data?.map((event) => <ArticleCard key={event.id} event={event} />)}
    </div>
  );
}
