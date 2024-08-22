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
import { formatEpochTime, getAvatar } from "~/lib/utils";
import { useAppState } from "~/store";
import { type Profile } from "~/types";
import { MessageCircle, ZapIcon } from "lucide-react";
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
        <CardContent className="flex flex-col px-4 pb-0 pt-4 md:px-6">
          {/* <div className="md:flex-1 md:p-0"> */}
          {/* <div className="flex items-center justify-between"> */}

          {/* User image and name */}
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

          {/* </div> */}
          <Link
            className="flex flex-col gap-2 pb-4 pt-4"
            href={`/a/${makeNaddr(event, relays)}`}
          >
            <div className="flex flex-col">
              <div className="flex items-start justify-between sm:items-center">
                <div className="flex flex-col items-start gap-2">
                  <h2 className="line-clamp-3 text-ellipsis break-words text-xl font-bold leading-6 sm:text-2xl sm:leading-7">
                    {getTag("title", event.tags)}
                  </h2>
                  <h3 className="line-clamp-2 text-ellipsis whitespace-break-spaces pt-0 text-[1rem] text-muted-foreground">
                    {parseContent(event.content) || "No content \n "}
                  </h3>
                  <div className="mt-4 hidden gap-4 text-sm text-muted-foreground sm:flex">
                    <div className="text-muted-foreground">
                      {formatEpochTime(event.created_at)}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ZapIcon className="h-4 w-4" />
                      33.1k
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MessageCircle className="h-4 w-4" />
                      33.1k
                    </div>
                  </div>
                </div>

                <Image
                  className="ml-6 h-14 w-20 shrink-0 rounded-md object-cover sm:ml-14 sm:h-28 sm:w-40"
                  src={
                    getTag("image", event.tags) ??
                    getFirstImage(event.content) ??
                    ""
                  }
                  width={160}
                  height={112}
                  alt=""
                />
              </div>
              <div className="mt-6 flex gap-4 text-sm text-muted-foreground sm:hidden">
                <div className="text-muted-foreground">
                  {formatEpochTime(event.created_at)}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ZapIcon className="h-4 w-4" />
                  33.1k
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  33.1k
                </div>
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>
      <div className="w-full px-4 md:px-6">
        <Separator />
      </div>
    </Fragment>
  );
}
