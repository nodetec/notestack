import { useContext, useEffect, useState } from "react";
import Button from "../../Button";
import { BsPatchCheckFill, BsLightningChargeFill } from "react-icons/bs";
import { utils } from "lnurl-pay";
import Link from "next/link";
import Buttons from "@/app/Buttons";
import FollowButton from "./FollowButton";
import AccountSettings from "@/app/AccountSettings";
import { UserContext } from "@/app/context/user-provider";
import { RelayContext } from "@/app/context/relay-provider";
import Followers from "./Followers";
import LightningTip from "@/app/LightningTip";
import { Event, nip19 } from "nostr-tools";
import { ProfilesContext } from "@/app/context/profiles-provider";
import { DUMMY_PROFILE_API } from "@/app/lib/constants";
import { KeysContext } from "@/app/context/keys-provider";

export default function UserCard({ npub }: any) {
  // @ts-ignore
  const { activeRelay, isLoading } = useContext(RelayContext);
  // @ts-ignore
  const { keys } = useContext(KeysContext);

  const [isOpen, setIsOpen] = useState(false);
  const [isTipOpen, setIsTipOpen] = useState(false);

  // @ts-ignore
  const { user } = useContext(UserContext);

  const [loggedInPubkey, setLoggedInPubkey] = useState<string>();

  // @ts-ignore
  const { profiles, setProfiles, reload } = useContext(ProfilesContext);

  const [name, setName] = useState<string>();
  const [about, setAbout] = useState<string>();
  const [picture, setPicture] = useState<string>();
  const [nip05, setNip05] = useState<string>();
  const [lud06, setLud06] = useState<string>();
  const [lud16, setLud16] = useState<string>();

  // check if it's the logged in user, if so set cached info
  // check if it's some other profile
  // if so see if we have cached profile info
  // if we don't look up the user
  const profilePubkey = nip19.decode(npub).data.toString();

  useEffect(() => {
    if (!activeRelay) return;
    // console.log("HIIIIIIIIII!!!!!!!!!!!");
    let relayUrl = activeRelay.url.replace("wss://", "");
    const cachedProfile = profiles[`profile_${relayUrl}_${profilePubkey}`];
    if (cachedProfile && cachedProfile.content) {
      const profileContent = JSON.parse(cachedProfile.content);
      setName(profileContent.name);
      setAbout(profileContent.about);

      if (profileContent.picture) {
        setPicture(profileContent.picture);
      } else {
        setPicture(DUMMY_PROFILE_API(npub));
      }
      setNip05(profileContent.nip05);
      setLud06(profileContent.lud06);
      setLud16(profileContent.lud16);
    } else {
      setName("");
      setAbout("");
      if ("") {
        setPicture("");
      } else {
        setPicture(DUMMY_PROFILE_API(npub));
      }
      setNip05("");
      setLud06("");
      setLud16("");
      let sub = activeRelay.sub([
        {
          kinds: [0],
          authors: [profilePubkey],
        },
      ]);
      let events: Event[] = [];
      sub.on("event", (event: Event) => {
        // @ts-ignore
        event.relayUrl = relayUrl;
        events.push(event);
      });
      sub.on("eose", () => {
        if (events.length !== 0) {
          let event = events[0];
          let profileKey = `profile_${relayUrl}_${event.pubkey}`;
          const contentObj = JSON.parse(event.content);
          setName(contentObj.name);
          setAbout(contentObj.about);
          if (contentObj.picture) {
            setPicture(contentObj.picture);
          } else {
            setPicture(DUMMY_PROFILE_API(npub));
          }
          setNip05(contentObj.nip05);
          setLud06(contentObj.lud06);
          setLud16(contentObj.lud16);
          profiles[profileKey] = event.content;
          setProfiles(profiles);
        }
        sub.unsub();
      });
    }
  }, [activeRelay, profiles, reload]);

  useEffect(() => {
    setLoggedInPubkey(keys.publicKey);
  }, []);

  const handleClick = async () => {
    setIsOpen(!isOpen);
  };

  const handleTipClick = async () => {
    setIsTipOpen(!isTipOpen);
  };

  return (
    <div className="flex flex-col">
      <Link href={`/u/${npub}`}>
        <img
          className="rounded-full w-24 h-24 object-cover mb-4"
          src={picture}
          alt={name}
        />
        <span>{name}</span>
      </Link>
      {/* TODO: we can do a overlay popup for this */}
      <Followers npub={npub} />
      <div className="font-semibold">
        {nip05 && (
          <div className="text-sm text-gray mb-2 ">
            <div className="flex items-center gap-1">
              <span className="max-w-[8rem] overflow-scroll">{nip05}</span>
              <BsPatchCheckFill className="text-blue-500" size="14" />
            </div>
          </div>
        )}
        {lud16 && utils.isLightningAddress(lud16) && (
          <div className="text-sm text-gray mb-2">
            <div className="flex items-center gap-1">
              <span className="whitespace-nowrap">{`${lud16} ⚡`}</span>
            </div>
          </div>
        )}
      </div>
      <p className="text-sm mb-4 text-gray max-w-[12rem] overflow-scroll">{about}</p>
      {keys.publicKey &&
        (keys.publicKey === profilePubkey ? (
          <Buttons>
            <Button
              color="green"
              variant="ghost"
              onClick={handleClick}
              size="xs"
            >
              Edit profile
            </Button>
          </Buttons>
        ) : (
          <div className="flex items-center gap-2">
            <FollowButton
              loggedInUserPublicKey={loggedInPubkey}
              profilePublicKey={profilePubkey}
            />
            {(lud06 || lud16) && (
              <Button
                color="red"
                variant="solid"
                onClick={handleTipClick}
                icon={<BsLightningChargeFill />}
                title="tip"
              />
            )}
          </div>
        ))}
      {activeRelay && name && keys.publicKey === profilePubkey ? (
        <AccountSettings
          name={name}
          nip05={nip05}
          about={about}
          picture={picture}
          loggedInPubkey={keys.publicKey}
          lud06={lud06}
          lud16={lud16}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />
      ) : (
        <LightningTip
          lud06={lud06}
          lud16={lud16}
          isTipOpen={isTipOpen}
          setIsTipOpen={setIsTipOpen}
        />
      )}
    </div>
  );
}
