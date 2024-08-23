"use client";

import { useQuery } from "@tanstack/react-query";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { getArticles, getReadRelays } from "~/lib/nostr";

import { ArticleCard } from "./ArticleCard";
import { SkeletonArticleFeed } from "./SkeletonArticleFeed";

type Props = {
  publicKey: string | undefined;
};

export function ArticleFeed({ publicKey }: Props) {
  const { data: userReadRelays } = useQuery({
    queryKey: ["userReadRelays"],
    refetchOnWindowFocus: false,
    queryFn: () => getReadRelays(publicKey, DEFAULT_RELAYS),
  });

  const relays = userReadRelays && userReadRelays.length > 0 ? userReadRelays : DEFAULT_RELAYS;

  const { data: articleEvents, status } = useQuery({
    queryKey: ["articles", relays],
    refetchOnWindowFocus: false,
    queryFn: () => getArticles(relays),
    enabled: !!relays.length,
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

