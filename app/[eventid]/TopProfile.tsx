import { getTagValues, shortenHash } from "../lib/utils";
import { Event, nip19 } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import { DUMMY_PROFILE_API } from "../lib/constants";
import Link from "next/link";
import { DatePosted } from "../Article";
import { RelayContext } from "../context/relay-provider";
import { ProfilesContext } from "../context/profiles-provider";

interface TopProfileProps {
  event: Event;
}

const TopProfile = ({ event }: TopProfileProps) => {
  const tags = event.tags;
  const publishedAt = parseInt(getTagValues("published_at", tags));
  const npub = nip19.npubEncode(event.pubkey);
  const [name, setName] = useState<string>();
  const [picture, setPicture] = useState<string>(DUMMY_PROFILE_API(npub));

  // @ts-ignore
  const { relayUrl } = useContext(RelayContext);

  // @ts-ignore
  const { profiles, reload, addProfiles } = useContext(ProfilesContext);

  // clean this up as well
  const getProfile = () => {
    let relayName = relayUrl.replace("wss://", "");
    const profileKey = `profile_${relayName}_${event.pubkey}`;
    const profile = profiles[profileKey];
    if (!profile) {
      addProfiles([profileKey]);
    }
    if (profile && profile.content) {
      const profileContent = JSON.parse(profile.content);
      setName(profileContent.name);
      if (!profileContent.picture || profileContent.picture === "") {
        setPicture(DUMMY_PROFILE_API(npub));
      } else {
        setPicture(profileContent.picture);
      }
    }
  };

  useEffect(() => {
    getProfile();
  }, [relayUrl, reload]);

  return (
    <div className="flex flex-row gap-2 items-center">
      <Link href={`u/${npub}`}>
        <img
          className="rounded-full w-11 h-11 object-cover"
          src={picture}
          alt={""}
        />
      </Link>
      <div className="flex flex-col gap-1">
        <Link href={`u/${npub}`}>
          <span className="hover:underline text-sm">
            {name || shortenHash(npub)}
          </span>
        </Link>
        <DatePosted timestamp={publishedAt || event.created_at} />
      </div>
    </div>
  );
};

export default TopProfile;
