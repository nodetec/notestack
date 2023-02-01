"use client";

import Popup from "@/app/Popup";
import { useNostr } from "nostr-react";
import { Fragment, useContext, useEffect, useState } from "react";
import { KeysContext } from "../context/keys-provider";
import type { Event } from "nostr-tools";
import PopupInput from "../PopupInput";
import Button from "../Button";

const Account = () => {
  const [popup, setPopup] = useState("");
  const [profileInfo, setProfileInfo] = useState({ name: "" });
  const [profileEvents, setProfileEvents] = useState<Event[]>();
  const { name } = profileInfo;
  const { connectedRelays } = useNostr();

  // @ts-ignore
  const { keys } = useContext(KeysContext);
  console.log("PUBKEY", keys.publicKey);

  useEffect(() => {
    const filter = {
      kinds: [0],
      authors: [keys.publicKey],
    };
    if (keys.publicKey) {
      const eventsSeen: { [k: string]: boolean } = {};
      let eventArray: Event[] = [];
      connectedRelays.forEach((relay) => {
        let sub = relay.sub([filter]);
        sub.on("event", (event: Event) => {
          if (!eventsSeen[event.id!]) {
            eventArray.push(event);
          }
          eventsSeen[event.id!] = true;
        });
        sub.on("eose", () => {
          // console.log("EOSE");
          // console.log("EXPLORE eventArray", eventArray);
          setProfileEvents(eventArray);

          try {
            const content = eventArray[0]?.content;
            const contentObj = JSON.parse(content);
            // nip05 = contentObj?.nip05;
            // about = contentObj?.about;
            // lud06 = contentObj?.lud06;
            // lud16 = contentObj?.lud16;
            // picture = contentObj?.picture || DUMMY_PROFILE_API(npub);
            // setProfileInfo({ name, about, picture });
            setProfileInfo({ ...profileInfo, name: contentObj?.name });
          } catch {
            console.log("Error parsing content");
          }
          // setNewName(eventArray[0].content.name);

          // const [profile, setProfile] = useState({
          //   newName: "test",
          // });
          sub.unsub();
        });
      });
    }
  }, [connectedRelays, keys]);

  // const { newName } = profile;

  return (
    <Fragment>
      <div className="flex flex-col gap-2">
        <Item title="Name" value={name} onClick={() => setPopup("name")} />
      </div>
      <Popup
        title="Name"
        isOpen={popup === "name"}
        setIsOpen={() => setPopup("")}
      >
        <PopupInput
          label="Name"
          value={name}
          minLength={1}
          error={false}
          maxLength={32}
          message={"Name must be between 1 and 32 characters."}
          onChange={(e) =>
            setProfileInfo({ ...profileInfo, name: e.target.value })
          }
        />
        <div className="flex items-center gap-2 justify-end">
          <Button
            color="green"
            size="sm"
            variant="outline"
            onClick={() => setPopup("")}
          >
            Cancel
          </Button>
          <Button color="green" size="sm">
            Save
          </Button>
        </div>
      </Popup>
    </Fragment>
  );
};

const Item = ({
  title,
  value,
  onClick,
}: {
  title: string;
  value: string;
  onClick: () => void;
}) => (
  <button
    className="w-full flex items-center gap-2 justify-between text-sm"
    onClick={onClick}
  >
    <h3>{title}</h3>
    <span className="text-gray hover:text-gray-hover">{value}</span>
  </button>
);

export default Account;
