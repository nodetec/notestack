import { Fragment, useMemo } from "react";

import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { useBatchedProfileEvent } from "~/hooks/useBatchedProfileEvent";
import { parseProfileEvent } from "~/lib/events/profile-event";
import { getFirstImage, parseContent, readingTime } from "~/lib/markdown";
import { createArticleLink, getTag } from "~/lib/nostr";
import { formatEpochTime } from "~/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { type Event } from "nostr-tools";

import { ArticleCardProfile } from "./ArticleCardProfile";

type Props = {
  articleEvent: Event;
  relays: string[];
};

export function ArticleCard({ articleEvent, relays }: Props) {
  const { data: profileEvent, isFetching } = useBatchedProfileEvent(
    relays,
    articleEvent.pubkey,
  );

  const profile = useMemo(
    () => (profileEvent ? parseProfileEvent(profileEvent) : null),
    [profileEvent],
  );

  return (
    <Fragment key={articleEvent.id}>
      <Card className="w-full border-none bg-secondary shadow-none">
        <CardContent className="flex flex-col px-4 pb-0 pt-4 md:px-6">
          {/* User image and name */}
          <ArticleCardProfile
            profile={profile}
            publicKey={articleEvent.pubkey}
            isFetching={isFetching}
          />

          <Link
            className="flex flex-col gap-2 pb-4 pt-4"
            href={createArticleLink(profile, articleEvent, relays)}
          >
            <div className="flex flex-col">
              <div className="flex items-start justify-between sm:items-center">
                <div className="flex flex-col items-start gap-2">
                  <h2 className="line-clamp-3 text-ellipsis break-words text-xl font-bold leading-6 sm:text-2xl sm:leading-7">
                    {getTag("title", articleEvent.tags)}
                  </h2>
                  <h3 className="break-anywhere line-clamp-2 text-ellipsis whitespace-break-spaces text-pretty pt-0 text-[1rem] text-muted-foreground">
                    {parseContent(articleEvent.content) || "No content \n "}
                  </h3>
                  <div className="mt-4 hidden gap-1 text-sm text-muted-foreground sm:flex">
                    <div className="text-muted-foreground">
                      {formatEpochTime(articleEvent.created_at)}
                    </div>
                    <span>•</span>
                    <span>{readingTime(articleEvent?.content)}</span>
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
                    getTag("image", articleEvent.tags) ??
                    getFirstImage(articleEvent.content) ??
                    "/images/transparent-160-112.png"
                  }
                  width={160}
                  height={112}
                  alt=""
                  loading="lazy"
                />
              </div>
              <div className="mt-6 flex gap-1 text-sm text-muted-foreground sm:hidden">
                <div className="text-muted-foreground">
                  {formatEpochTime(articleEvent.created_at)}
                </div>
                <span>•</span>
                <span>{readingTime(articleEvent?.content)}</span>
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
