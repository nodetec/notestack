"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserRelays } from "~/lib/nostr";
import { useAppState } from "~/store";

import { RelayForm } from "./RelayForm";

type Props = {
  publicKey: string;
};

export function RelaySettings({ publicKey }: Props) {
  const relays = useAppState((state) => state.relays);

  const defaultValues = {
    relays: [{ url: "", read: true, write: true }],
  };

  const { data: userRelays, isFetching } = useQuery({
    queryKey: ["userRelays"],
    refetchOnWindowFocus: false,
    queryFn: () => getUserRelays(publicKey, relays),
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
