"use client";
import Link from "next/link";
import { useNostrEvents, useProfile } from "nostr-react";
import { nip19 } from "nostr-tools";
import AsideSection from "./AsideSection";
import { getTagValues } from "./lib/utils";

interface RecommendedEventsProps {
  EVENTS: string[];
  title: string;
  showProfile?: boolean;
}

const RecommendedEvents: React.FC<RecommendedEventsProps> = ({
  EVENTS,
  title,
  showProfile = false,
}) => {
  const { events } = useNostrEvents({
    filter: {
      ids: EVENTS,
      kinds: [2222],
    },
  });

  return (
    <AsideSection title={title}>
      <ul className="flex flex-col gap-2">
        {events.map((event) => (
          <Event
            key={event.id}
            noteId={event.id!}
            pubkey={showProfile ? event.pubkey : undefined}
            title={getTagValues("subject", event.tags)}
          />
        ))}
      </ul>
    </AsideSection>
  );
};

const Event = ({
  noteId,
  pubkey = "",
  title,
}: {
  noteId: string;
  pubkey?: string;
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
            src={data?.picture}
            alt=""
          />
          <span className="text-xs font-medium group-hover:underline">
            {data?.name}
          </span>
        </Link>
      ) : null}
      <Link
        href={`/${noteNpub}`}
        className={pubkey ? "font-bold text-base" : "text-sm"}
      >
        {title}
      </Link>
    </li>
  );
};

export default RecommendedEvents;
