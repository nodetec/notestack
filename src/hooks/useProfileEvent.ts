import { useQuery } from "@tanstack/react-query";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { getProfileEvent } from "~/lib/nostr";
import { type Event } from "nostr-tools";

export const useProfileEvent = (relays: string[], publicKey: string | undefined) => {
  return useQuery<Event | null>({
    queryKey: ["profile", publicKey],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: !!publicKey,
    queryFn: () => getProfileEvent(relays ?? DEFAULT_RELAYS, publicKey),
  });
};
