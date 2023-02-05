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
import { nip19 } from "nostr-tools";
import { ProfilesContext } from "@/app/context/profiles-provider";
import { DUMMY_PROFILE_API } from "@/app/lib/constants";

export default function UserCard({ npub }: any) {
  // @ts-ignore
  const { activeRelay } = useContext(RelayContext);

  const [isOpen, setIsOpen] = useState(false);
  const [isTipOpen, setIsTipOpen] = useState(false);

  // @ts-ignore
  const { user } = useContext(UserContext);

  // @ts-ignore
  const { profiles, pubkeys, setpubkeys } = useContext(ProfilesContext);

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

  useEffect(() => {
    // if (!activeRelay) return;
    // if (!user) return;
    // let relayUrl = activeRelay.url.replace("wss://", "");
    // if (!user[`user_${relayUrl}`]) return;
    // const cachedUser = user[`user_${relayUrl}`];
    // if (!cachedUser) return;
    // console.log("FROM PROFILE: cachedUser", cachedUser);
    // const profilePubkey = nip19.decode(npub).data.valueOf();
    // if (profilePubkey === cachedUser.pubkey) {
    //   const cachedUserContent = JSON.parse(cachedUser.content);
    //   setName(cachedUserContent.name);
    //   setAbout(cachedUserContent.about);
    //   setPicture(cachedUserContent.picture);
    //   setNip05(cachedUserContent.nip05);
    //   setLud06(cachedUserContent.lud06);
    //   setLud16(cachedUserContent.lud16);
    // }

    if (!activeRelay) return;
    if (!profiles) return;
    const profilePubkey = nip19.decode(npub).data.valueOf();
    let relayUrl = activeRelay.url.replace("wss://", "");
    const cachedProfile = profiles[`profile_${relayUrl}_${profilePubkey}`];
    if (cachedProfile) {
      console.log("GETTING PROFILE FROM CACHE", cachedProfile);
      // const cachedUserContent = JSON.parse(cachedUser.content);
      setName(cachedProfile.name);
      setAbout(cachedProfile.about);

      if (cachedProfile.picture) {
        setPicture(cachedProfile.picture);
      } else {
        setPicture(DUMMY_PROFILE_API(profilePubkey.toString()));
      }
      setNip05(cachedProfile.nip05);
      setLud06(cachedProfile.lud06);
      setLud16(cachedProfile.lud16);
    } else {
      setpubkeys([...pubkeys, profilePubkey]);
      setName("");
      setAbout("");
      setPicture(DUMMY_PROFILE_API(profilePubkey.toString()));
      setNip05("");
      setLud06("");
      setLud16("");
    }
  }, [profiles, activeRelay]);

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
          <div className="text-sm text-gray mb-2">
            <div className="flex items-center gap-1">
              <span>{nip05}</span>
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
      <p className="text-sm mb-4 text-gray">{about}</p>
      {/* {loggedInPubkey && */}
      {/*   (loggedInPubkey === profilePubkey ? ( */}
      {/*     <Buttons> */}
      {/*       <Button */}
      {/*         color="green" */}
      {/*         variant="ghost" */}
      {/*         onClick={handleClick} */}
      {/*         size="xs" */}
      {/*       > */}
      {/*         Edit profile */}
      {/*       </Button> */}
      {/*     </Buttons> */}
      {/*   ) : ( */}
      {/*     <div className="flex items-center gap-2"> */}
      {/*       <FollowButton */}
      {/*         loggedInUserPublicKey={loggedInPubkey} */}
      {/*         currentContacts={loggedInContactList} */}
      {/*         profilePublicKey={profilePubkey} */}
      {/*         contacts={contacts} */}
      {/*       /> */}
      {/*       {(lud06 || lud16) && ( */}
      {/*         <Button */}
      {/*           color="red" */}
      {/*           variant="solid" */}
      {/*           onClick={handleTipClick} */}
      {/*           icon={<BsLightningChargeFill />} */}
      {/*           title="tip" */}
      {/*         /> */}
      {/*       )} */}
      {/*     </div> */}
      {/*   ))} */}
      {/* {loggedInPubkey === profilePubkey ? ( */}
      {/*   <AccountSettings */}
      {/*     name={name} */}
      {/*     nip05={nip05} */}
      {/*     about={about} */}
      {/*     picture={picture} */}
      {/*     loggedInPubkey={loggedInPubkey} */}
      {/*     lud06={lud06} */}
      {/*     lud16={lud16} */}
      {/*     isOpen={isOpen} */}
      {/*     setIsOpen={setIsOpen} */}
      {/*   /> */}
      {/* ) : ( */}
      {/*   <LightningTip */}
      {/*     lud06={lud06} */}
      {/*     lud16={lud16} */}
      {/*     isTipOpen={isTipOpen} */}
      {/*     setIsTipOpen={setIsTipOpen} */}
      {/*   /> */}
      {/* )} */}
    </div>
  );
}
