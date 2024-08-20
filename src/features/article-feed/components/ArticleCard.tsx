import { Fragment } from "react";

import { useQuery } from "@tanstack/react-query";
import { create, keyResolver, windowScheduler } from "@yornaath/batshit";
import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { getFirstImage, parseContent } from "~/lib/markdown";
import { getProfiles, getTag, makeNaddr, shortNpub } from "~/lib/nostr";
import { useAppState } from "~/store";
import Image from "next/image";
import Link from "next/link";
import { type Event } from "nostr-tools";

const profiles = create({
  fetcher: async (publicKeys: string[]) => {
    const appState = useAppState.getState();
    const { relays } = appState;
    return getProfiles(relays, publicKeys);
  },
  resolver: keyResolver("publicKeys"),
  scheduler: windowScheduler(10),
});

const useProfiles = (publicKey: string) => {
  return useQuery({
    queryKey: ["profile", publicKey],
    refetchOnWindowFocus: false,
    queryFn: () => profiles.fetch(publicKey),
  });
};

type Props = {
  event: Event;
};

export function ArticleCard({ event }: Props) {
  const relays = useAppState((state) => state.relays);

  const { data } = useProfiles(event.pubkey);

  return (
    <Fragment key={event.id}>
      <Card className="w-full border-none bg-secondary shadow-none">
        <Link href={`/a/${makeNaddr(event, relays)}`}>
          <CardContent className="flex items-center p-4 md:p-6">
            <div className="md:flex-1 md:p-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <span>Technology</span>
                  <span className="mx-2">•</span>
                  <span>{data?.name ?? shortNpub(event.pubkey)}</span>
                </div>
              </div>
              <h3 className="mt-2 text-[1.35rem] font-bold">
                {getTag("title", event.tags)}
              </h3>
              {/* <p className="mt-2 text-muted-foreground">{event.content}</p> */}
              <div className="mt-2 line-clamp-3 text-ellipsis whitespace-break-spaces pt-0 text-muted-foreground">
                {parseContent(event.content) || "No content \n "}
              </div>
            </div>
            <Image
              className="ml-2 h-14 w-20 rounded-md object-cover md:ml-14 md:h-28 md:w-40"
              src={
                getTag("image", event.tags) ??
                getFirstImage(event.content) ??
                ""
              }
              width={160}
              height={112}
              alt=""
            />
          </CardContent>
        </Link>
      </Card>
      <div className="w-full px-4">
        <Separator />
      </div>
    </Fragment>
  );
}
