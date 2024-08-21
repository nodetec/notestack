import { Fragment } from "react";

import { useQuery } from "@tanstack/react-query";
import {
  bufferScheduler,
  create,
  keyResolver,
  windowScheduler,
} from "@yornaath/batshit";
import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { getFirstImage, parseContent } from "~/lib/markdown";
import { getProfiles, getTag, makeNaddr, shortNpub } from "~/lib/nostr";
import { getAvatar } from "~/lib/utils";
import { useAppState } from "~/store";
import { type Profile } from "~/types";
import Image from "next/image";
import Link from "next/link";
import { type Event } from "nostr-tools";

type Props = {
  event: Event;
};

// TODO: figure out scheduler
const profiles = create({
  fetcher: async (publicKeys: string[]) => {
    const relays = useAppState.getState().relays;
    return await getProfiles(relays, publicKeys);
  },
  resolver: keyResolver("pubkey"),
});

export function ArticleCard({ event }: Props) {
  const relays = useAppState((state) => state.relays);

  const { data: profile, isFetching } = useQuery<Profile>({
    queryKey: ["profile", event.pubkey],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      return await profiles.fetch(event.pubkey);
    },
  });

  return (
    <Fragment key={event.id}>
      <Card className="w-full border-none bg-secondary shadow-none">
        <Link href={`/a/${makeNaddr(event, relays)}`}>
          <CardContent className="flex items-center p-4 md:p-6">
            <div className="md:flex-1 md:p-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isFetching ? (
                    <>
                      <Skeleton className="aspect-square w-5 overflow-hidden rounded-full object-cover" />
                      <Skeleton className="h-4 w-20" />
                    </>
                  ) : (
                    <>
                      <Image
                        className="aspect-square w-5 overflow-hidden rounded-full object-cover"
                        src={profile?.picture ?? getAvatar(profile?.publicKey)}
                        width={48}
                        height={48}
                        alt=""
                      />
                      <span>{profile?.name ?? shortNpub(event.pubkey)}</span>
                    </>
                  )}
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
