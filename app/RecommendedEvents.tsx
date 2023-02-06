"use client";
import Link from "next/link";
import { nip19 } from "nostr-tools";
import AsideSection from "./AsideSection";
import { DUMMY_PROFILE_API } from "./lib/constants";
import { getTagValues, markdownImageContent, shortenHash } from "./lib/utils";
import { Event } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import { RelayContext } from "./context/relay-provider";
import { FeedContext } from "./context/feed-provider";

interface RecommendedEventsProps {
  // EVENTS: [];
  title: string;
  showProfile?: boolean;
  showThumbnail?: boolean;
}

export default function RecommendedEvents({
  // EVENTS,
  title,
  showProfile = false,
  showThumbnail = false,
}: RecommendedEventsProps) {
  // let recommendedEvents: Event[] = [];

  // @ts-ignore
  const { activeRelay, isLoading } = useContext(RelayContext);
  const [recommendedEvents, setRecommendedEvents] = useState<Event[]>([]);

  // @ts-ignore
  const { feed, setFeed } = useContext(FeedContext);

  // useEffect(() => {
  //   if (!activeRelay) return;
  //   // if (!feed) return;
  //   // setRecommendedEvents([]);
  //   let relayUrl = activeRelay.url.replace("wss://", "");
  //   let feedKey = `latest_${relayUrl}`;

  //   if (feed[feedKey]) {
  //     // console.log("Cached events from context");

  //     if (feed[feedKey].length > 3) {
  //       const randomEvents = feed[feedKey]
  //         .sort(() => 0.5 - Math.random())
  //         .slice(0, 3);
  //       setRecommendedEvents(randomEvents);
  //     } else {
  //       setRecommendedEvents(feed[feedKey].slice(0, 3));
  //     }
  //   }
  // }, [feed, activeRelay]);

  // if (EVENTS.length === 0) return null;

  return (
    <AsideSection title={title}>
      <ul className="flex flex-col gap-2">
        {isLoading ? (
          <span>Loading...</span>
        ) : (
          activeRelay &&
          feed &&
          feed[`latest_${activeRelay.url.replace("wss://", "")}`] &&
          Array.from(feed[`latest_${activeRelay.url.replace("wss://", "")}`])
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map((event: any) => (
              <Event
                key={event.id}
                noteId={event.id!}
                pubkey={showProfile ? event.pubkey : undefined}
                title={getTagValues("subject", event.tags)}
                thumbnail={
                  showThumbnail
                    ? markdownImageContent(event.content) || undefined
                    : undefined
                }
              />
            ))
        )}
      </ul>
    </AsideSection>
  );
}

const Event = ({
  noteId,
  pubkey = "",
  thumbnail,
  title,
}: {
  noteId: string;
  pubkey?: string;
  thumbnail?: RegExpExecArray;
  title: string;
}) => {
  const profileNpub = nip19.npubEncode(pubkey);
  const noteNpub = nip19.noteEncode(noteId);

  return (
    <li>
      {pubkey ? (
        <Link
          href={`u/${profileNpub}`}
          className="flex items-center gap-2 py-2 group"
        >
          <img
            className="w-5 h-5 bg-gray rounded-full object-cover"
            // src={data?.picture || DUMMY_PROFILE_API(profileNpub)}
            src={DUMMY_PROFILE_API(profileNpub)}
            alt=""
          />
          <span className="text-xs font-medium group-hover:underline">
            {/* {data?.name || shortenHash(pubkey)} */}
            {shortenHash(pubkey)}
          </span>
        </Link>
      ) : null}
      <Link
        href={`/${noteNpub}`}
        className={`flex gap-2 justify-between ${
          pubkey ? "font-bold text-base" : ""
        }`}
      >
        <span>{title}</span>
        {thumbnail ? (
          <img
            className="w-16 h-16 object-contain"
            src={thumbnail.groups?.filename}
            alt={thumbnail.groups?.title}
          />
        ) : null}
      </Link>
    </li>
  );
};
