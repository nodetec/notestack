import {
  useInfiniteQuery,
  type QueryFunctionContext,
} from "@tanstack/react-query";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { type RelayMetadata } from "~/lib/events/relay-metadata-event";
import { getArticles, getTag } from "~/lib/nostr";
import { useAppState } from "~/store";
import { useSearchParams } from "next/navigation";
import type { Event } from "nostr-tools";
import { toast } from "sonner";

const fetchArticles = async ({
  pageParam = 0,
  queryKey,
}: QueryFunctionContext) => {
  const page = (pageParam as number) || 0;
  const relays = queryKey[1] as string[];
  const publicKey = queryKey[2] as string;
  const followEvent = queryKey[3] as Event;
  const feed = queryKey[4] as string;
  const response = await getArticles(
    relays,
    page,
    publicKey,
    followEvent,
    feed,
  );

  const addArticle = useAppState.getState().addArticle;

  if (response.articles.length === 0) {
    toast("You've reached the end", {
      description: "No more articles found",
    });
  }

  response.articles.forEach((article) => {
    const identifier = getTag("d", article.tags);
    const publicKey = article.pubkey;
    const id = identifier + publicKey;
    addArticle(id, article);
  });

  return response;
};

export const useArticleFeed = (
  profilePublicKey: string | undefined,
  userFollowEvent: Event | null | undefined,
  profileRelayMetadata: RelayMetadata | null | undefined,
  nip05HintRelays: string[],
  isProfileFeed: boolean,
) => {
  const searchParams = useSearchParams();

  // console.log("ARTICLE FEED PROFILE PUBLIC KEY", profilePublicKey);
  // console.log("ARTICLE FEED USER FOLLOW EVENT", userFollowEvent);
  // console.log("ARTICLE FEED PROFILE RELAY METADATA", profileRelayMetadata);
  // console.log("ARTICLE FEED NIP05 HINT RELAYS", nip05HintRelays);

  let relays = profileRelayMetadata?.writeRelays ?? DEFAULT_RELAYS;

  relays = [...relays, ...nip05HintRelays];
  // make sure relays is unique
  relays = Array.from(new Set(relays));

  // console.log("ARTICLE FEED RELAYS", relays);

  const enabled =
    (isProfileFeed &&
      profileRelayMetadata !== undefined &&
      userFollowEvent !== undefined) ||
    (!isProfileFeed && userFollowEvent !== undefined);

  return useInfiniteQuery({
    queryKey: [
      "articles",
      relays,
      profilePublicKey,
      userFollowEvent,
      searchParams.get("feed"),
    ],
    queryFn: fetchArticles,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    gcTime: Infinity,
    staleTime: Infinity,
    initialPageParam: 0,
    enabled,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
};
