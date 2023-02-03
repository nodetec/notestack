"use client";
import Popup from "./Popup";
import { useContext, useEffect, useState } from "react";
import Button from "./Button";
import { useNostr } from "nostr-react";
import type { Event } from "nostr-tools";
import { utils } from "lnurl-pay";
import { bech32 } from "bech32";
import { NostrService } from "@/app/lib/nostr";
import PopupInput from "@/app/PopupInput";
import { UserContext } from "./context/user-provider";

export default function AccountSettings({ isOpen, setIsOpen }: any) {
  const { connectedRelays } = useNostr();
  const { publish } = useNostr();
  const [newName, setNewName] = useState<string>();
  const [newAbout, setNewAbout] = useState<string>();
  const [newPicture, setNewPicture] = useState<string>();
  const [newNip05, setNewNip05] = useState<string>();
  const [newLud06, setNewLud06] = useState<string>();
  const [newLud16, setNewLud16] = useState<string>();
  const [newLnAddress, setNewLnAddress] = useState<any>();
  const [convertedAddress, setConvertedAddress] = useState<any>();
  const [loggedInPubkey, setLoggedInPubkey] = useState<any>();

  // @ts-ignore
  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    console.log("CONTENT:", user.content);
    setLoggedInPubkey(user.pubkey);
    if (user.content) {
      const contentObj = JSON.parse(user.content);
      setNewLnAddress(contentObj.lud16);
      setNewName(contentObj.name);
      setNewAbout(contentObj.about);
      setNewPicture(contentObj.picture);
      setNewNip05(contentObj.nip05);
      setNewLud06(contentObj.lud06);
      setNewLud16(contentObj.lud16);
    }
  }, [user, isOpen]);

  async function convert(newLnAddress: string) {
    if (newLnAddress) {
      const url = utils.decodeUrlOrAddress(newLnAddress);

      if (utils.isUrl(url)) {
        try {
          const response = await fetch(url);

          if (utils.isLnurl(newLnAddress)) {
            const data = await response.json();
            const newConvertedAddress = JSON.parse(data.metadata)[0][1];

            setNewLud16(newConvertedAddress);
            setNewLud06(newLnAddress);
            setConvertedAddress(newConvertedAddress);
            console.log(newConvertedAddress); // chrisatmachine@getalby.com
          }

          if (utils.isLightningAddress(newLnAddress)) {
            let words = bech32.toWords(Buffer.from(url, "utf8"));
            let newConvertedAddress = "";
            newConvertedAddress = bech32.encode("lnurl", words, 2000);
            setNewLud06(newConvertedAddress);
            setNewLud16(newLnAddress);
            setConvertedAddress(newConvertedAddress);
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
  }

  useEffect(() => {
    async function getLnAddress() {
      if (newLnAddress) {
        convert(newLnAddress);
      }
    }
    setConvertedAddress("");
    getLnAddress();
  }, [newLnAddress]);

  const handleSubmitNewProfile = async (e: any) => {
    e.preventDefault();

    const content = {
      name: newName,
      about: newAbout,
      picture: newPicture,
      nip05: newNip05,
      lud06: newLud06,
      lud16: newLud16,
    };

    const stringifiedContent = JSON.stringify(content);

    let event = NostrService.createEvent(
      0,
      loggedInPubkey,
      stringifiedContent,
      []
    );

    try {
      event = await NostrService.addEventData(event);
    } catch (err: any) {
      return;
    }

    // remove from cache
    sessionStorage.removeItem(loggedInPubkey + "_profile");
    sessionStorage.removeItem(loggedInPubkey + "_user");

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
        setIsOpen(!isOpen);
      });
      sub.on("eose", () => {
        console.log("EOSE");
        sub.unsub();
      });
    });

    const pubs = publish(event);

    // @ts-ignore
    for (const pub of pubs) {
      pub.on("ok", () => {
        console.log("OUR EVENT WAS ACCEPTED");
        setUser(event);
      });

      pub.on("seen", async () => {
        console.log("OUR EVENT WAS SEEN");
        setIsOpen(!isOpen);
      });

      pub.on("failed", (reason: any) => {
        console.log("OUR EVENT HAS FAILED BECAUSE:", reason);
        setIsOpen(!isOpen);
      });
    }
  };

  return (
    <Popup
      title="Edit Profile"
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      className="h-3/4 max-h-192 inset-0 overflow-auto scroll-smooth"
    >
      <PopupInput
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        label="Name"
      />
      <PopupInput
        value={newNip05}
        onChange={(e) => setNewNip05(e.target.value)}
        label="NIP-05 ID"
      />
      <PopupInput
        value={newPicture}
        onChange={(e) => setNewPicture(e.target.value)}
        label="Profile Image Url"
      />
      <PopupInput
        value={newAbout}
        onChange={(e) => setNewAbout(e.target.value)}
        label="About"
      />
      <h3 className="text-xl  text-center pt-4">⚡ Enable Lightning Tips ⚡</h3>
      <PopupInput
        value={newLnAddress}
        onChange={(e) => setNewLnAddress(e.target.value)}
        label="Lightning Address or LUD-06 Identifier"
      ></PopupInput>

      <h5 className="text bg-neutral-200 overflow-x-scroll rounded-md text-center p-3 mb-3">
        <div className="cursor-text  flex justify-start whitespace-nowrap items-center">
          <div className="pr-4">{convertedAddress}</div>
        </div>
      </h5>
      <Button
        variant="solid"
        onClick={handleSubmitNewProfile}
        size="sm"
        className="w-1/4"
      >
        Save
      </Button>
    </Popup>
  );
}
