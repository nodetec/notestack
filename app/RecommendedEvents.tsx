"use client";
import Link from "next/link";
import { nip19 } from "nostr-tools";
import AsideSection from "./AsideSection";
import { DUMMY_PROFILE_API } from "./lib/constants";
import { getTagValues, markdownImageContent, shortenHash } from "./lib/utils";
import { Event } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import { RelayContext } from "./context/relay-provider";
import { ProfilesContext } from "./context/profiles-provider";
import { CachedEventContext } from "./context/cached-event-provider";
import { AddressPointer } from "nostr-tools/nip19";
import { useRouter } from "next/navigation";
import RecommendedEventsSkeleton from "./components/Skeleton/RecommendedEvents";

interface RecommendedEventsProps {
  events: Event[];
  title: string;
  showProfile?: boolean;
  showThumbnail?: boolean;
  className?: string;
  isEventsLoading?: boolean;
}

export default function RecommendedEvents({
  events,
  title,
  isEventsLoading = false,
  showProfile = false,
  showThumbnail = false,
  className = "",
}: RecommendedEventsProps) {
  // let recommendedEvents: Event[] = [];

  // const [recommendedEvents, setRecommendedEvents] = useState<Event[]>([]);

  return (
    <AsideSection title={title} className={className}>
      <ul className="flex flex-col gap-2">
        {isEventsLoading
          ? Array.from(Array(3)).map((_, i) => (
              <RecommendedEventsSkeleton key={i} />
            ))
          : events.map((event: any) => (
              <Event
                key={event.id}
                noteId={event.id!}
                event={event}
                pubkey={showProfile ? event.pubkey : undefined}
                title={getTagValues("title", event.tags)}
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
  event,
  pubkey = "",
  thumbnail,
  title,
}: {
  noteId: string;
  event: Event;
  pubkey?: string;
  thumbnail?: RegExpExecArray;
  title: string;
}) => {
  const npub = nip19.npubEncode(pubkey);
  const noteNpub = nip19.noteEncode(noteId);

  const { tags } = event;
  const { relayUrl, activeRelay } = useContext(RelayContext);

  // @ts-ignore
  const { profiles, reload } = useContext(ProfilesContext);
  const { setCachedEvent } = useContext(CachedEventContext);

  const [picture, setPicture] = useState();
  const [name, setName] = useState();
  const router = useRouter();

  useEffect(() => {
    setName(getName(event));
    setPicture(getPicture(event));
  }, [activeRelay, reload]);

  const getPicture = (event: Event) => {
    if (!activeRelay) return;
    const relayUrl = activeRelay.url.replace("wss://", "");
    const profileKey = `profile_${relayUrl}_${event.pubkey}`;
    const profile = profiles[profileKey];

    if (profile && profile.content) {
      // TODO: check if this exists
      const profileContent = JSON.parse(profile.content);
      return profileContent.picture || DUMMY_PROFILE_API(npub);
    }

    return DUMMY_PROFILE_API(npub);
  };

  const getName = (event: Event) => {
    if (!activeRelay) return;
    const relayUrl = activeRelay.url.replace("wss://", "");
    const profileKey = `profile_${relayUrl}_${event.pubkey}`;
    const profile = profiles[profileKey];

    if (profile && profile.content) {
      const profileContent = JSON.parse(profile.content);
      return profileContent.name || shortenHash(npub);
    }

    return shortenHash(npub);
  };

  const routeCachedEvent = () => {
    setCachedEvent(event);

    const identifier = getTagValues("d", tags);

    // TODO: handle relays
    const addressPointer: AddressPointer = {
      identifier: identifier,
      pubkey: event.pubkey,
      kind: 30023,
      relays: [relayUrl],
    };

    // router.push("/" + nip19.noteEncode(event.id!));
    router.push("/" + nip19.naddrEncode(addressPointer));
  };

  return (
    <li>
      {pubkey ? (
        <Link href={`u/${npub}`} className="flex items-center gap-2 py-2 group">
          <img
            className="w-5 h-5 bg-gray rounded-full object-cover"
            src={picture || DUMMY_PROFILE_API(npub)}
            alt=""
          />
          <span className="text-xs font-medium group-hover:underline">
            {name || shortenHash(pubkey)}
          </span>
        </Link>
      ) : null}
      <div
        onClick={routeCachedEvent}
        className={`cursor-pointer flex gap-2 justify-between ${
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
      </div>
    </li>
  );
};
