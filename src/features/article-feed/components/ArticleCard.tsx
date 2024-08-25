import { Fragment } from "react";

import { useQuery } from "@tanstack/react-query";
import { create, keyResolver, windowScheduler } from "@yornaath/batshit";
import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { getFirstImage, parseContent, readingTime } from "~/lib/markdown";
import { createArticleLink, getProfiles, getTag, makeNaddr, shortNpub } from "~/lib/nostr";
import { formatEpochTime, getAvatar } from "~/lib/utils";
import { type Profile } from "~/types";
import { memoize } from "lodash-es";
import { MessageCircle, ZapIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type Event } from "nostr-tools";
import { ArticleCardProfile } from "./ArticleCardProfile";

type Props = {
  event: Event;
  relays: string[];
};

export const key = "publicKeys";

// TODO: figure out scheduler
// TODO: figure out types
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const batcher = memoize((relays: string[]) => {
  return create({
    name: key,
    fetcher: async (publicKeys: string[]) => {
      console.log("Fetching profiles", publicKeys);
      return await getProfiles(relays, publicKeys);
    },
    scheduler: windowScheduler(10),
    resolver: keyResolver("pubkey"),
  });
});

export function ArticleCard({ event, relays }: Props) {
  const { data: profile, isFetching } = useQuery<Profile>({
    queryKey: ["profile", event.pubkey],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      // TODO: figure out types
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return await batcher(relays).fetch(event.pubkey);
    },
  });

  return (
    <Fragment key={event.id}>
      <Card className="w-full border-none bg-secondary shadow-none">
        <CardContent className="flex flex-col px-4 pb-0 pt-4 md:px-6">

          {/* User image and name */}
          <ArticleCardProfile
            profile={profile}
            publicKey={event.pubkey}
            isFetching={isFetching}
          />

          <Link
            className="flex flex-col gap-2 pb-4 pt-4"
            href={createArticleLink(profile, event, relays)}
          >
            <div className="flex flex-col">
              <div className="flex items-start justify-between sm:items-center">
                <div className="flex flex-col items-start gap-2">
                  <h2 className="line-clamp-3 text-ellipsis break-words text-xl font-bold leading-6 sm:text-2xl sm:leading-7">
                    {getTag("title", event.tags)}
                  </h2>
                  <h3 className="break-anywhere line-clamp-2 text-ellipsis whitespace-break-spaces text-pretty pt-0 text-[1rem] text-muted-foreground">
                    {parseContent(event.content) || "No content \n "}
                  </h3>
                  <div className="mt-4 hidden gap-1 text-sm text-muted-foreground sm:flex">
                    <div className="text-muted-foreground">
                      {formatEpochTime(event.created_at)}
                    </div>
                    <span>•</span>
                    <span>{readingTime(event?.content)}</span>
                    {/* <div className="flex items-center gap-1 text-muted-foreground"> */}
                    {/*   <ZapIcon className="h-4 w-4" /> */}
                    {/*   33.1k */}
                    {/* </div> */}
                    {/* <div className="flex items-center gap-1 text-muted-foreground"> */}
                    {/*   <MessageCircle className="h-4 w-4" /> */}
                    {/*   42 */}
                    {/* </div> */}
                  </div>
                </div>

                <Image
                  className="ml-6 h-14 w-20 shrink-0 rounded-md object-cover sm:ml-14 sm:h-28 sm:w-40"
                  src={
                    getTag("image", event.tags) ??
                    getFirstImage(event.content) ??
                    "/images/transparent-160-112.png"
                  }
                  width={160}
                  height={112}
                  alt=""
                />
              </div>
              <div className="mt-6 flex gap-1 text-sm text-muted-foreground sm:hidden">
                <div className="text-muted-foreground">
                  {formatEpochTime(event.created_at)}
                </div>
                <span>•</span>
                <span>{readingTime(event?.content)}</span>
                {/* <div className="flex items-center gap-1 text-muted-foreground"> */}
                {/*   <ZapIcon className="h-4 w-4" /> */}
                {/*   33.1k */}
                {/* </div> */}
                {/* <div className="flex items-center gap-1 text-muted-foreground"> */}
                {/*   <MessageCircle className="h-4 w-4" /> */}
                {/*   33.1k */}
                {/* </div> */}
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
