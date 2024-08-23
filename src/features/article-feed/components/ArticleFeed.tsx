"use client";

import { useQuery } from "@tanstack/react-query";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { getPosts, getReadRelays } from "~/lib/nostr";

import { ArticleCard } from "./ArticleCard";
import { SkeletonArticleFeed } from "./SkeletonArticleFeed";

type Props = {
  publicKey: string | undefined;
};

export function ArticleFeed({ publicKey }: Props) {
  const { data: userReadRelays } = useQuery({
    queryKey: ["userReadRelays"],
    refetchOnWindowFocus: false, // Disable refetching on window focus for now
    queryFn: () => getReadRelays(publicKey, DEFAULT_RELAYS),
  });

  const relays = userReadRelays && userReadRelays.length > 0 ? userReadRelays : DEFAULT_RELAYS;

  console.log("relays", relays);

  const { data: articleEvents, status } = useQuery({
    queryKey: ["articles", relays],
    refetchOnWindowFocus: false, // Disable refetching on window focus for now
    queryFn: () => getPosts(relays),
    enabled: !!relays.length, // Only enable when relays is non-empty
  });

  if (status === "pending") {
    return <SkeletonArticleFeed />;
  }

  return (
    <>
      {status === "success" && articleEvents && relays && (
        <div className="min-w-3xl mx-auto mt-12 flex w-full max-w-3xl flex-col items-center gap-y-4">
          {articleEvents?.map((event) => (
            <ArticleCard key={event.id} event={event} relays={relays} />
          ))}
        </div>
      )}
    </>
  );
}

