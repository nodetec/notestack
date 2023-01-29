"use client";
import Link from "next/link";
import { useNostrEvents, useProfile } from "nostr-react";
import { nip19 } from "nostr-tools";
import AsideSection from "./AsideSection";
import { getTagValues } from "./lib/utils";

const EVENTS = [
  "616c252e86c5488faf65b5247800b517f00c658b528435bde12c481c4c0b3f37",
  "f09bb957509a5bcf902e3aa0d8ba6dacfb365595ddcc9a28bc895f0b93be4f79",
  "112f5761e3206b90fc2a5d35b0dd8a667be2ce62721e565f6b1285205d5a8e27",
];

const RecommendedEvents = () => {
  const { events } = useNostrEvents({
    filter: {
      ids: EVENTS,
      kinds: [2222],
    },
  });

  console.log(events);

  return (
    <AsideSection title="Recommended Events">
      <ul className="flex flex-col gap-2">
        {events.map((event) => (
          <Event
            key={event.id}
            pubkey={event.pubkey}
            title={getTagValues("subject", event.tags)}
          />
        ))}
      </ul>
    </AsideSection>
  );
};

const Event = ({ pubkey, title }: { pubkey: string; title: string }) => {
  const { data } = useProfile({
    pubkey: pubkey,
  });
  const npub = nip19.npubEncode(pubkey);

  return (
    <li>
      <Link href={`u/${npub}`} className="flex items-center gap-2 py-2 group">
        <img
          className="w-5 h-5 bg-gray rounded-full object-cover"
          src={data?.picture}
          alt=""
        />
        <span className="text-xs font-medium group-hover:underline">
          {data?.name}
        </span>
      </Link>
      <h3 className="font-bold text-base">{title}</h3>
    </li>
  );
};

export default RecommendedEvents;
