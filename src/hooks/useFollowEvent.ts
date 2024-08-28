import { useQuery } from "@tanstack/react-query";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { getFollowEvent } from "~/lib/nostr";

export const useFollowEvent = (
  publicKey: string | undefined,
  relays?: string[],
) => {
  if (!relays) {
    relays = DEFAULT_RELAYS;
  }

  return useQuery({
    queryKey: ["followList", publicKey],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    gcTime: Infinity,
    staleTime: Infinity,
    queryFn: () => getFollowEvent(relays, publicKey),
    // enabled: !!publicKey,
  });
};
