"use client";

import { useQuery } from "@tanstack/react-query";
import { getPosts } from "~/lib/nostr";
import { useAppState } from "~/store";

import { ArticleCard } from "./ArticleCard";
import { SkeletonArticleFeed } from "./SkeletonArticleFeed";

type Props = {
  publicKey: string | undefined;
};

export function ArticleFeed({ publicKey }: Props) {
  const relays = useAppState((state) => state.relays);

  const { data: articleEvents, status } = useQuery({
    queryKey: ["articles"],
    refetchOnWindowFocus: false, // Disable refetching on window focus for now
    queryFn: () => getPosts(relays),
  });

  if (status === "pending") {
    return <SkeletonArticleFeed />;
  }

  return (
    <>
      {status === "success" && articleEvents && (
        <div className="min-w-3xl mx-auto mt-12 flex w-full max-w-3xl flex-col items-center gap-y-4">
          {articleEvents?.map((event) => (
            <ArticleCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </>
  );
}
