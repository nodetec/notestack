import { useQuery } from "@tanstack/react-query";
import { create, keyResolver, windowScheduler } from "@yornaath/batshit";
import { getProfileEvents } from "~/lib/nostr";
import { memoize } from "lodash-es";
import { type Event } from "nostr-tools";

const batcher = memoize((relays: string[]) => {
  return create({
    name: "publicKeys",
    fetcher: async (publicKeys: string[]) => {
      console.log("Fetching profiles", publicKeys);
      return await getProfileEvents(relays, publicKeys);
    },
    scheduler: windowScheduler(10),
    resolver: keyResolver("pubkey"),
  });
});

export const useBatchedProfileEvent = (relays: string[], publicKey: string) => {
  return useQuery<Event>({
    queryKey: ["profile", publicKey],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      return await batcher(relays).fetch(publicKey);
    },
  });
};
