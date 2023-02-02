"use client";

import Popup from "@/app/Popup";
import { useNostr } from "nostr-react";
import { Fragment, useContext, useEffect, useState } from "react";
import { KeysContext } from "../context/keys-provider";
import type { Event } from "nostr-tools";
import PopupInput from "../PopupInput";
import Button from "../Button";
import { NostrService } from "@/app/lib/nostr";
import { DUMMY_PROFILE_API } from "../lib/constants";
import { utils } from "lnurl-pay";
import { bech32 } from "bech32";

const Account = () => {
  const [profileInfo, setProfileInfo] = useState({
    name: "",
    about: "",
    picture: "",
    nip05: "",
    lud06: "",
    lud16: "",
    convertedAddress: "",
  });
  const [popup, setPopup] = useState("");
  const { name, about, picture, nip05, lud06 } = profileInfo;
  const [newProfile, setNewProfile] = useState(profileInfo);
  const { connectedRelays } = useNostr();
  const { publish } = useNostr();

  useEffect(() => {
    setNewProfile(profileInfo);
  }, [profileInfo, popup]);

  // @ts-ignore
  const { keys } = useContext(KeysContext);

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
          try {
            const content = eventArray[0]?.content;
            const contentObj = JSON.parse(content);
            const { name, about, nip05, lud06, lud16 } = contentObj;
            const picture =
              contentObj?.picture || DUMMY_PROFILE_API(keys.publicKey);
            setProfileInfo({
              ...newProfile,
              name,
              about,
              picture,
              nip05,
              lud06,
              lud16,
            });
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
    // eslint-disable-next-line
  }, [connectedRelays, keys]);

  const handleSubmitNewProfile = async (e: any) => {
    e.preventDefault();

    const content = {
      name: newProfile.name,
      about: newProfile.about,
      picture: newProfile.picture,
      nip05: newProfile.nip05,
      lud06: newProfile.lud06,
      lud16: newProfile.lud16,
    };

    const stringifiedContent = JSON.stringify(content);

    let event = NostrService.createEvent(
      0,
      keys.publicKey,
      stringifiedContent,
      []
    );

    try {
      event = await NostrService.addEventData(event);
    } catch (err: any) {
      // setPost({ postSending: false, postError: err.message });
      return;
    }

    let eventId: any = null;
    eventId = event?.id;

    connectedRelays.forEach((relay) => {
      let sub = relay.sub([
        {
          ids: [eventId],
        },
      ]);
      sub.on("event", (event: Event) => {
        console.log("we got the event we wanted:", event);
        setPopup("");
      });
      sub.on("eose", () => {
        console.log("EOSE");
        sub.unsub();
      });
    });

    const pubs = publish(event);

    // @ts-ignore
    for await (const pub of pubs) {
      pub.on("ok", () => {
        console.log("OUR EVENT WAS ACCEPTED");
        // setPost({ postSending: false, postError: "" });
      });

      await pub.on("seen", async () => {
        console.log("OUR EVENT WAS SEEN");
        setPopup("");
      });

      pub.on("failed", (/* reason: any */) => {
        // setPost({ postSending: false, postError: reason });
        console.log("OUR EVENT HAS FAILED");
      });
    }
  };

  async function convert(newLnAddress: any) {
    const url = utils.decodeUrlOrAddress(newLnAddress);

    if (utils.isUrl(url)) {
      try {
        const response = await fetch(url);

        if (utils.isLnurl(newLnAddress)) {
          console.log("RESPONSE:", response);
          const data = await response.json();
          console.log("DATA:", data);
          console.log("METADATA:", JSON.parse(data.metadata)[0][1]);
          const newConvertedAddress = JSON.parse(data.metadata)[0][1];

          setNewProfile({
            ...newProfile,
            lud16: newConvertedAddress,
            convertedAddress: newConvertedAddress,
          });
        }

        if (utils.isLightningAddress(newLnAddress)) {
          let words = bech32.toWords(Buffer.from(url, "utf8"));
          let newConvertedAddress = "";
          newConvertedAddress = bech32.encode("lnurl", words, 2000);
          setNewProfile({
            ...newProfile,
            lud06: newConvertedAddress,
            convertedAddress: newConvertedAddress,
          });
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  useEffect(() => {
    async function getLnAddress() {
      if (newProfile.lud16) {
        convert(newProfile.lud16);
      }
    }
    setNewProfile({ ...newProfile, convertedAddress: "" });
    getLnAddress();
    // eslint-disable-next-line
  }, [newProfile.lud16]);

  return (
    <Fragment>
      <div className="flex flex-col gap-6">
        <Item title="Name" value={name} onClick={() => setPopup("Name")} />
        <Item
          title="NIP-05 ID"
          value={nip05}
          onClick={() => setPopup("NIP-05 ID")}
        />
        <Item title="About" value={about} onClick={() => setPopup("About")} />
        <Item
          title="Picture"
          value={picture}
          onClick={() => setPopup("Picture")}
        />
        <Item
          title="Lightning Tips"
          value={lud06}
          onClick={() => setPopup("Lightning Tips")}
        />
      </div>
      <Popup title={popup} isOpen={!!popup} setIsOpen={() => setPopup("")}>
        {popup === "Name" ? (
          <PopupInput
            label="Name"
            minLength={1}
            maxLength={32}
            value={newProfile.name}
            error={false}
            message={"Name must be between 1 and 32 characters."}
            onChange={(e) =>
              setNewProfile({ ...newProfile, name: e.target.value })
            }
          />
        ) : null}
        {popup === "NIP-05 ID" ? (
          <PopupInput
            label="NIP-05 ID"
            minLength={1}
            maxLength={256}
            value={newProfile.nip05}
            message={"NIP-05 ID must be between 1 and 256 characters."}
            onChange={(e) =>
              setNewProfile({ ...newProfile, nip05: e.target.value })
            }
          />
        ) : null}
        {popup === "About" ? (
          <PopupInput
            label="About"
            minLength={1}
            maxLength={256}
            value={newProfile.about}
            error={false}
            message={"About must be between 1 and 256 characters."}
            onChange={(e) =>
              setNewProfile({ ...newProfile, about: e.target.value })
            }
          />
        ) : null}
        {popup === "Picture" ? (
          <Fragment>
            <img
              src={newProfile.picture}
              className="bg-light-gray w-28 h-28 rounded-full object-cover"
              alt=""
            />
            <PopupInput
              label="Profile Image URL"
              minLength={1}
              maxLength={256}
              value={newProfile.picture}
              message={"Picture must be between 1 and 256 characters."}
              onChange={(e) =>
                setNewProfile({ ...newProfile, picture: e.target.value })
              }
            />
          </Fragment>
        ) : null}
        {popup === "Lightning Tips" ? (
          <Fragment>
            <PopupInput
              label="Lightning Address or LUD-06 Identifier"
              minLength={1}
              maxLength={256}
              value={newProfile.lud16}
              message={"NIP-05 ID must be between 1 and 256 characters."}
              onChange={(e) =>
                setNewProfile({ ...newProfile, lud16: e.target.value })
              }
            />
            {newProfile.convertedAddress ? (
              <p className="w-full overflow-x-scroll mt-2 py-2">
                {newProfile.convertedAddress}
              </p>
            ) : null}
          </Fragment>
        ) : null}
        <div className="flex items-center mt-2 gap-2 justify-end">
          <Button
            color="green"
            size="sm"
            variant="outline"
            onClick={() => setPopup("")}
          >
            Cancel
          </Button>
          <Button color="green" size="sm" onClick={handleSubmitNewProfile}>
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
    className="w-full flex items-center gap-4 justify-between text-sm"
    onClick={onClick}
  >
    <h3>{title}</h3>
    <span className="text-gray max-w-[80%] overflow-hidden hover:text-gray-hover">
      {value}
    </span>
  </button>
);

export default Account;
