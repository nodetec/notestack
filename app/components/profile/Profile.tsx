import { nip19 } from "nostr-tools";
import UserCard from "./UserCard";

import { memo, useContext } from "react";
import { KeysContext } from "../../context/keys-provider.jsx";
import { DUMMY_PROFILE_API } from "@/app/lib/constants";
import { useNostrEvents } from "nostr-react";

const Profile = ({ npub, setProfileInfo }: any) => {
  const profilePubkey = nip19.decode(npub).data.valueOf();
  // @ts-ignore
  const { keys } = useContext(KeysContext);
  const loggedInPubkey = keys?.publicKey;
  const authors: any = [profilePubkey];
  let profileMetadata;
  let kinds = [0, 3];

  if (loggedInPubkey) {
    authors.push(loggedInPubkey);
  }

  const profileEventsString = sessionStorage.getItem(
    profilePubkey + "_profile"
  );

  if (profileEventsString) {
    const cachedEvents = JSON.parse(profileEventsString);
    profileMetadata = cachedEvents;
    kinds = [3];
    console.log("using cached profile for user:", npub);
  }

  const { events } = useNostrEvents({
    filter: {
      kinds,
      authors,
      limit: 5,
    },
  });

  let name;
  let about;
  let picture;
  let lud06;
  let lud16;
  let nip05;

  if (!profileMetadata) {
    profileMetadata = events.filter(
      (event) => event.kind === 0 && profilePubkey === event.pubkey
    );
    if (profileMetadata.length > 0) {
      const profilesString = JSON.stringify(profileMetadata);
      sessionStorage.setItem(profilePubkey + "_profile", profilesString);
    }
  }

  try {
    const content = profileMetadata[0]?.content;
    const contentObj = JSON.parse(content);
    name = contentObj?.name;
    nip05 = contentObj?.nip05;
    about = contentObj?.about;
    lud06 = contentObj?.lud06;
    lud16 = contentObj?.lud16;
    picture = contentObj?.picture || DUMMY_PROFILE_API(npub);
    setProfileInfo({ name, about, picture });
  } catch {
    console.log("Error parsing content");
  }

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
      picture={picture}
      lud06={lud06}
      lud16={lud16}
    />
  );
};

export default memo(Profile);
