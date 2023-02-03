import { nip19 } from "nostr-tools";
import UserCard from "./UserCard";

import { memo, useContext, useEffect, useState } from "react";
import { KeysContext } from "../../context/keys-provider.jsx";
import { DUMMY_PROFILE_API } from "@/app/lib/constants";
import { useNostrEvents } from "nostr-react";
import { UserContext } from "@/app/context/user-provider";

const Profile = ({ npub, setProfileInfo }: any) => {
  const profilePubkey = nip19.decode(npub).data.valueOf();
  // @ts-ignore
  const { keys } = useContext(KeysContext);
  const loggedInPubkey = keys?.publicKey;
  const authors: any = [profilePubkey];
  let kinds = [0, 3];

  const [name, setName] = useState<string>();
  const [about, setAbout] = useState<string>();
  const [picture, setPicture] = useState<string>();
  const [nip05, setNip05] = useState<string>();
  const [lud06, setLud06] = useState<string>();
  const [lud16, setLud16] = useState<string>();

  // @ts-ignore
  const { user } = useContext(UserContext);

  useEffect(() => {
    if (user.content && user.pubkey === profilePubkey) {
      const contentObj = JSON.parse(user.content);
      const name = contentObj.name;
      const about = contentObj.about;
      const picture = contentObj.picture;
      setName(name);
      setAbout(about);
      setPicture(picture);
      setNip05(contentObj.nip05);
      setLud06(contentObj.lud06);
      setLud16(contentObj.lud16);
      setProfileInfo({ name, about, picture });
    }
  }, [user]);

  if (loggedInPubkey) {
    authors.push(loggedInPubkey);
  }

  const { events } = useNostrEvents({
    filter: {
      kinds,
      authors,
      limit: 5,
    },
  });

  useEffect(() => {
    let profileMetadata;

    const profileEventsString = sessionStorage.getItem(
      profilePubkey + "_profile"
    );

    if (profileEventsString) {
      const cachedEvents = JSON.parse(profileEventsString);
      profileMetadata = cachedEvents;
      kinds = [3];
      console.log("using cached profile for user:", npub);
    }

    if (!profileMetadata) {
      profileMetadata = events.filter(
        (event) => event.kind === 0 && profilePubkey === event.pubkey
      );
      if (profileMetadata.length > 0) {
        const profilesString = JSON.stringify(profileMetadata);
        sessionStorage.setItem(profilePubkey + "_profile", profilesString);
      }
    }

    if (user.pubkey !== profilePubkey) {
      try {
        const content = profileMetadata[0]?.content;
        const contentObj = JSON.parse(content);
        const name = contentObj.name;
        const about = contentObj.about;
        const picture = contentObj.picture;
        setName(name);
        setAbout(about);
        setPicture(picture);
        setNip05(contentObj.nip05);
        setLud06(contentObj.lud06);
        setLud16(contentObj.lud16);
        setProfileInfo({ name, about, picture });
      } catch {
        console.log("Error parsing content");
      }
    }
  }, [events]);

  // contacts for the profile you're visiting
  const profileContactEvents = events.filter(
    (event) => event.kind === 3 && event.pubkey === profilePubkey
  );
  const profileContactList = profileContactEvents[0]?.tags;

  // contacts for the logged in user
  const loggedInContactEvents = events.filter(
    (event) => event.kind === 3 && event.pubkey === loggedInPubkey
  );
  const loggedInContactList = loggedInContactEvents[0]?.tags;

  return (
    <UserCard
      loggedInPubkey={loggedInPubkey}
      loggedInContactList={loggedInContactList}
      profileContactList={profileContactList}
      profilePubkey={profilePubkey}
      name={name}
      npub={npub}
      nip05={nip05}
      about={about}
      picture={picture || DUMMY_PROFILE_API(profilePubkey.toString())}
      lud06={lud06}
      lud16={lud16}
    />
  );
};

export default memo(Profile);
