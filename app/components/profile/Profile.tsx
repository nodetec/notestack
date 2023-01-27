import { useNostrEvents } from "nostr-react";
import { nip19 } from "nostr-tools";
import Contacts from "./Contacts";
// import LatestNotes from "./LatestNotes";
import UserCard from "./UserCard";

import { useContext } from "react";
import { KeysContext } from "../../context/keys-provider.jsx";
import { DUMMY_PROFILE_API } from "@/app/lib/constants";

export default function Profile({ npub, setName }: any) {
  const profilePubkey = nip19.decode(npub).data.valueOf();

  // @ts-ignore
  const { keys } = useContext(KeysContext);
  const loggedInPubkey = keys?.publicKey;

  const authors: any = [profilePubkey];

  if (loggedInPubkey) {
    authors.push(loggedInPubkey);
  }

  const { events } = useNostrEvents({
    filter: {
      kinds: [0, 3],
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

  const profileMetadata = events.filter(
    (event) => event.kind === 0 && profilePubkey === event.pubkey
  );

  try {
    const content = profileMetadata[0]?.content;
    const contentObj = JSON.parse(content);
    name = contentObj?.name;
    setName(name);
    nip05 = contentObj?.nip05;
    about = contentObj?.about;
    lud06 = contentObj?.lud06;
    lud16 = contentObj?.lud16;
    picture = contentObj?.picture || DUMMY_PROFILE_API(name || npub);
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
    <div className="flex flex-col flex-shrink md:sticky top-4 w-auto md:w-[25%] max-w-[22rem]">
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
      {profileContactList && <Contacts userContacts={profileContactList} />}
    </div>
  );
}
