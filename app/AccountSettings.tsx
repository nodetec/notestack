"use client";
import Popup from "./Popup";
import { useContext, useEffect, useState } from "react";
import Button from "./Button";
import { utils } from "lnurl-pay";
import { bech32 } from "bech32";
import { NostrService } from "@/app/lib/nostr";
import PopupInput from "@/app/PopupInput";
import { UserContext } from "./context/user-provider";
import { RelayContext } from "./context/relay-provider";
import { ProfilesContext } from "./context/profiles-provider";

export default function AccountSettings({
  name,
  nip05,
  about,
  picture,
  banner,
  loggedInPubkey,
  lud06,
  lud16,
  isOpen,
  setIsOpen,
}: any) {
  const [newName, setNewName] = useState<string>(name);
  const [newAbout, setNewAbout] = useState<string>(about);
  const [newPicture, setNewPicture] = useState<string>(picture);
  const [newBanner, setNewBanner] = useState<string>(banner);
  const [newNip05, setNewNip05] = useState<string>(nip05);
  const [newLud06, setNewLud06] = useState<string>(lud06);
  const [newLud16, setNewLud16] = useState<string>(lud16);
  const [newLnAddress, setNewLnAddress] = useState<any>(lud16);
  const [convertedAddress, setConvertedAddress] = useState<any>();
  // const [loggedInPubkey, setLoggedInPubkey] = useState<any>();
  const { activeRelay } = useContext(RelayContext);
  // @ts-ignore
  const { setUser } = useContext(UserContext);
  // @ts-ignore
  const { profiles, setProfiles, setReload, reload } =
    useContext(ProfilesContext);

  useEffect(() => {
    // console.log("CONTENT:", user.content);
    // if (!activeRelay) return;
    // console.log("THE USER:", user);

    // if (!activeRelay) return;
    // if (!user) return;
    // let relayUrl = activeRelay.url.replace("wss://", "");
    // if (!user[`user_${relayUrl}`]) return;
    // setLoggedInPubkey(user[`user_${relayUrl}`].pubkey);

    setNewLnAddress(lud16);
    setNewName(name);
    // console.log("NAMEYNAMENAME:", name);
    setNewAbout(about);
    setNewPicture(picture);
    setNewBanner(banner);
    setNewNip05(nip05);
    setNewLud06(lud06);
    setNewLud16(lud16);
  }, [isOpen]);

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
            // console.log(newConvertedAddress); // chrisatmachine@getalby.com
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
      banner: newBanner,
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

    let pub = activeRelay.publish(event);
    pub.on("ok", () => {
      // console.log(`EVENT WAS ACCEPTED by ${activeRelay.url}`);
      setUser(event);
    });
    pub.on("seen", () => {
      // console.log(`EVENT WAS SEEN ON ${activeRelay.url}`);
      let relayUrl = activeRelay.url.replace("wss://", "");
      profiles[`profile_${relayUrl}_${event.pubkey}`] = event;

      setReload(!reload);
      setProfiles(profiles);
      setIsOpen(!isOpen);
    });
    pub.on("failed", (reason: string) => {
      // console.log(
      //   `OUR EVENT HAS FAILED WITH REASON: ${activeRelay.url}: ${reason}`
      // );
      setIsOpen(!isOpen);
    });
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
        value={newBanner}
        onChange={(e) => setNewBanner(e.target.value)}
        label="Banner Image Url"
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
