"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserRelays } from "~/lib/nostr";

import { RelayForm } from "./RelayForm";
import { DEFAULT_RELAYS } from "~/lib/constants";

type Props = {
  publicKey: string;
};

export function RelaySettings({ publicKey }: Props) {
  const defaultValues = {
    relays: [{ url: "", read: true, write: true }],
  };

  const { data: userRelays, isFetching } = useQuery({
    queryKey: ["userRelays"],
    refetchOnWindowFocus: false,
    queryFn: () => getUserRelays(publicKey, DEFAULT_RELAYS),
  });

  return (
    <div className="w-full">
      {isFetching ? (
        <div>Loading...</div>
      ) : (
        <RelayForm
          defaultValues={{ relays: userRelays } ?? defaultValues}
        />
      )}
    </div>
  );
}
