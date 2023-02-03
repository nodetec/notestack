"use client";
import Link from "next/link";
import { nip19, Relay } from "nostr-tools";
import AsideSection from "./AsideSection";
import { DUMMY_PROFILE_API } from "./lib/constants";
import { getTagValues, markdownImageContent, shortenHash } from "./lib/utils";
import { Event } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import { RelayContext } from "./context/relay-provider";
import { NostrService } from "./lib/nostr";

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
  let recommendedEvents: Event[] = [];

  // @ts-ignore
  const { connectedRelays, isLoading } = useContext(RelayContext);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const eventsSeen: { [k: string]: boolean } = {};
    let eventArray: Event[] = [];
    connectedRelays.forEach((relay: Relay) => {
      let sub = relay.sub([
        {
          ids: EVENTS,
          kinds: [2222],
          limit: 3,
        },
      ]);
      sub.on("event", (event: Event) => {
        if (!eventsSeen[event.id!]) {
          eventArray.push(event);
        }
        eventsSeen[event.id!] = true;
      });
      sub.on("eose", () => {
        console.log("EOSE initial latest events from", relay.url);
        const filteredEvents = NostrService.filterBlogEvents(eventArray);
        if (filteredEvents.length > 0) {
          setEvents(filteredEvents);
        }
        sub.unsub();
      });
    });
  }, [connectedRelays]);

  recommendedEvents = events;

  if (EVENTS.length === 0) return null;

  return (
    <AsideSection title={title}>
      <ul className="flex flex-col gap-2">
        {isLoading ? (
          <span>Loading...</span>
        ) : (
          recommendedEvents.map((event) => (
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

// TODO profile

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
