"use client";
import Link from "next/link";
import { useNostrEvents, useProfile } from "nostr-react";
import { nip19 } from "nostr-tools";
import AsideSection from "./AsideSection";
import { DUMMY_PROFILE_API } from "./lib/constants";
import { getTagValues, markdownImageContent, shortenHash } from "./lib/utils";
import { Event } from "nostr-tools";

interface RecommendedEventsProps {
  EVENTS: string[];
  title: string;
  showProfile?: boolean;
  showThumbnail?: boolean;
}

export default function RecommendedEvents({
  EVENTS,
  title,
  showProfile = false,
  showThumbnail = false,
}: RecommendedEventsProps) {
  // TODO do this manually and cache

  let recommendedEvents: Event[] = [];

  // const cachedRecommendedEvents = sessionStorage.getItem("recommended_events");
  // if (cachedRecommendedEvents) {
  //   recommendedEvents = JSON.parse(cachedRecommendedEvents);
  //   console.log("using cached recommended events");
  // }

  // if (!cachedRecommendedEvents) {
  const { events } = useNostrEvents({
    filter: {
      ids: EVENTS,
      kinds: [2222],
      limit: 3,
    },
  });
  recommendedEvents = events;
  //   if (events.length >= 3) {
  //     recommendedEvents = events;
  //     const eventsString = JSON.stringify(events);
  //     sessionStorage.setItem("recommended_events", eventsString);
  //   }
  // }

  return (
    <AsideSection title={title}>
      <ul className="flex flex-col gap-2">
        {recommendedEvents.map((event) => (
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
        ))}
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
  const { data } = useProfile({ pubkey });
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
            src={data?.picture || DUMMY_PROFILE_API(profileNpub)}
            alt=""
          />
          <span className="text-xs font-medium group-hover:underline">
            {data?.name || shortenHash(pubkey)}
          </span>
        </Link>
      ) : null}
      <Link
        href={`/${noteNpub}`}
        className={`flex gap-2 ${pubkey ? "font-bold text-base" : ""}`}
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
