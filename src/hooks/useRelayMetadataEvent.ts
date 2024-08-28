import { useQuery } from "@tanstack/react-query";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { getRelayMetadataEvent } from "~/lib/events/relay-metadata-event";

export const useRelayMetadataEvent = (
  publicKey: string | undefined,
  relays?: string[],
) => {
  if (!relays) {
    relays = DEFAULT_RELAYS;
  }

  return useQuery({
    queryKey: ["relayMetadata", publicKey],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    gcTime: Infinity,
    staleTime: Infinity,
    queryFn: () => getRelayMetadataEvent(relays, publicKey),
    // enabled: !!publicKey,
  });
};

