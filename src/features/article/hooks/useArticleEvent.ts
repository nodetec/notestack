import { useQuery } from "@tanstack/react-query";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { getEvent } from "~/lib/nostr";
import { useAppState } from "~/store";
import { type AddressPointer } from "nostr-tools/nip19";

const getCurrentArticle = async (
  address: AddressPointer,
  publicKey: string | undefined,
) => {
  const articleMap = useAppState.getState().articleMap;

  if (articleMap.has(address.identifier + address.pubkey)) {
    return articleMap.get(address.identifier + address.pubkey);
  }

  const filter = {
    kinds: [address.kind],
    limit: 1,
    "#d": [address.identifier],
  };

  let relays = address.relays;

  if (!relays) {
    relays = DEFAULT_RELAYS;
  }

  const event = await getEvent(filter, relays);

  if (!event) {
    throw new Error("Event not found");
  }

  return event;
};

export const useArticleEvent = (
  address: AddressPointer,
  publicKey: string | undefined,
) => {
  return useQuery({
    queryKey: ["article", address.pubkey, address.identifier],
    refetchOnWindowFocus: false,
    queryFn: () => getCurrentArticle(address, publicKey),
  });
};
