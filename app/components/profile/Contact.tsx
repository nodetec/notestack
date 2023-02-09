import Button from "@/app/Button";
import { ProfilesContext } from "@/app/context/profiles-provider";
import { RelayContext } from "@/app/context/relay-provider";
import { DUMMY_PROFILE_API } from "@/app/lib/constants";
import Tooltip from "@/app/Tooltip";
import Link from "next/link";
import { nip19 } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import { BiDotsHorizontalRounded } from "react-icons/bi";
import { shortenHash } from "../../lib/utils";

export default function Contact({ pubkey }: any) {
  // console.log("PUBKEY CONTACT", pubkey)
  let npub = nip19.npubEncode(pubkey);

  const [name, setName] = useState<string>();
  const [about, setAbout] = useState<string>();
  const [picture, setPicture] = useState<string>(DUMMY_PROFILE_API(npub));
  const [nip05, setNip05] = useState<string>();
  const [lud06, setLud06] = useState<string>();
  const [lud16, setLud16] = useState<string>();

  // const pubkey = contact.pubkey;
  const [showTooltip, setShowTooltip] = useState(false);

  // @ts-ignore
  const { activeRelay, relayUrl } = useContext(RelayContext);

  // @ts-ignore
  const { profiles, reload, addProfiles } = useContext(ProfilesContext);

  const getProfile = () => {
    let relayName = relayUrl.replace("wss://", "");
    const profileKey = `profile_${relayName}_${pubkey}`;
    const profile = profiles[profileKey];
    if (!profile) {
      addProfiles([pubkey]);
    }
    if (profile && profile.content) {
      const profileContent = JSON.parse(profile.content);
      setName(profileContent.name);
      setAbout(profileContent.about);
      if (!profileContent.picture || profileContent.picture === "") {
        setPicture(DUMMY_PROFILE_API(npub));
      } else {
        setPicture(profileContent.picture);
      }
    }
  };

  useEffect(() => {
    getProfile();
  }, [reload, relayUrl, activeRelay]);

  return (
    <li className="flex items-center justify-between gap-2">
      <Link
        href={`/u/${nip19.npubEncode(pubkey)}`}
        className="text-sm flex items-center gap-4 py-1"
      >
        <img
          className="rounded-full w-5 h-5 object-cover bg-light-gray"
          src={picture || DUMMY_PROFILE_API(npub!)}
          alt=""
        />
        <span className="text-gray hover:text-gray-hover hover:underline">
          {name || shortenHash(npub)}
        </span>
      </Link>
      <Tooltip
        show={showTooltip}
        toggle={() => setShowTooltip((current) => !current)}
        Component={
          <Button
            variant="solid"
            color="transparent"
            size="sm"
            icon={<BiDotsHorizontalRounded size="18" />}
          />
        }
      >
        <div className="w-[17rem]">
          <Link
            href={`/u/${nip19.npubEncode(pubkey)}`}
            className="text-sm flex items-center gap-2 pb-3"
          >
            <img
              className="rounded-full w-7 h-7 object-cover bg-light-gray"
              src={picture || DUMMY_PROFILE_API(npub)}
              alt=""
            />
            <h3 className="text-black font-medium text-lg">{name || npub}</h3>
          </Link>
          <p className="text-sm text-gray-hover pb-2 border-b border-b-light-gray">
            {about}
          </p>
          {/* <div className="flex items-center gap-2 justify-between pt-2"> */}
          {/* <span className="text-gray font-xs"> */}
          {/*   {followingsCount} Followings */}
          {/* </span> */}
          {/* <Button */}
          {/*   color="green" */}
          {/*   size="xs" */}
          {/*   className="py-1 px-2 text-xs" */}
          {/*   // FIXME: need follow functionality */}
          {/* > */}
          {/*   Follow */}
          {/* </Button> */}
          {/* </div> */}
        </div>
      </Tooltip>
    </li>
  );
}
