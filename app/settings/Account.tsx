"use client";

import Popup from "@/app/Popup";
import { Fragment, useContext, useEffect, useState } from "react";
import PopupInput from "../PopupInput";
import Button from "../Button";
import { RelayContext } from "../context/relay-provider";
import { utils } from "lnurl-pay";
import { bech32 } from "bech32";
import { NostrService } from "@/app/lib/nostr";
import { KeysContext } from "../context/keys-provider";
import { UserContext } from "../context/user-provider";
import { ProfilesContext } from "../context/profiles-provider";

const Account = () => {
  const initialProfileInfo = {
    name: "",
    about: "",
    picture: "",
    nip05: "",
    lud06: "",
    lud16: "",
    banner: "",
  };
  const [profileInfo, setProfileInfo] = useState(initialProfileInfo);
  const [popup, setPopup] = useState("");
  const [newProfile, setNewProfile] = useState(profileInfo);
  const { relayUrl, publish, activeRelay } = useContext(RelayContext);
  const [convertedAddress, setConvertedAddress] = useState<string>("");
  const [noChanges, setNoChanges] = useState(true);

  // @ts-ignore
  const { profiles, setProfiles, addProfiles, setReload, reload } =
    useContext(ProfilesContext);

  // @ts-ignore
  const { setUser } = useContext(UserContext);

  // @ts-ignore
  const { keys } = useContext(KeysContext);
  const loggedInPubkey = keys.publicKey;

  const resetProfile = () => {
    setProfileInfo(initialProfileInfo);
  };

  function removeUnderscoreAt(nip05: string) {
    if (nip05?.startsWith("_@")) {
      return nip05.slice(2);
    }
    return nip05;
  }

  const getProfile = () => {
    resetProfile();
    let relayName = relayUrl.replace("wss://", "");
    const profileKey = `profile_${relayName}_${loggedInPubkey}`;

    const profile = profiles[profileKey];
    if (!profile) {
      addProfiles([loggedInPubkey]);
    }
    if (profile && profile.content) {
      const profileContent = JSON.parse(profile.content);
      setProfileInfo({
        ...profileInfo,
        name: profileContent.name,
        about: profileContent.about,
        picture: profileContent.picture,
        banner: profileContent.banner,
        nip05: removeUnderscoreAt(profileContent.nip05),
        lud06: profileContent.lud06,
        lud16: profileContent.lud16,
      });
    }
  };

  useEffect(() => {
    setNewProfile(profileInfo);
  }, [profileInfo]);

  useEffect(getProfile, [reload, relayUrl, activeRelay]);

  useEffect(() => {
    let isDifferent = false;
    Object.keys(newProfile).forEach((key) => {
      // @ts-ignore
      if (profileInfo[key] !== newProfile[key]) {
        isDifferent = true;
      }
    });
    setNoChanges(!isDifferent);
  }, [newProfile, profileInfo]);

  const handleSubmitNewProfile = async (e: any) => {
    e.preventDefault();

    const content = {
      name: newProfile.name,
      about: newProfile.about,
      picture: newProfile.picture,
      banner: newProfile.banner,
      nip05: newProfile.nip05,
      lud06: newProfile.lud06,
      lud16: newProfile.lud16,
    };

    const stringifiedContent = JSON.stringify(content);

    let event = NostrService.createEvent(
      0,
      loggedInPubkey,
      stringifiedContent,
      []
    );

    event = await NostrService.signEvent(event);

    const onOk = async () => {};

    const onSeen = async () => {
      setUser(event);
      let relayName = relayUrl.replace("wss://", "");
      profiles[`profile_${relayName}_${event.pubkey}`] = event;
      setReload(!reload);
      setProfiles(profiles);
      setPopup("");
    };

    const onFailed = async () => {
      setPopup("");
    };

    publish([relayUrl], event, onOk, onSeen, onFailed);
  };

  async function convert(newLnAddress: string) {
    if (newLnAddress) {
      const url = utils.decodeUrlOrAddress(newLnAddress);

      if (utils.isUrl(url)) {
        try {
          const response = await fetch(url);

          if (utils.isLnurl(newLnAddress)) {
            const data = await response.json();
            const newConvertedAddress = JSON.parse(data.metadata)[0][1];

            setNewProfile({
              ...newProfile,
              lud06: newLnAddress,
            });
            setConvertedAddress(newConvertedAddress);
            // console.log(newConvertedAddress); // chrisatmachine@getalby.com
          }

          if (utils.isLightningAddress(newLnAddress)) {
            let words = bech32.toWords(Buffer.from(url, "utf8"));
            let newConvertedAddress = bech32.encode("lnurl", words, 2000);
            setNewProfile({
              ...newProfile,
              lud06: newLnAddress,
            });
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
      if (newProfile.lud16) {
        convert(newProfile.lud16);
      }
    }
    getLnAddress();
  }, [newProfile.lud16]);

  return (
    <Fragment>
      <div className="flex flex-col gap-6">
        <Item
          title="Name"
          value={newProfile.name}
          onClick={() => setPopup("Name")}
        />
        <Item
          title="NIP-05 ID"
          value={newProfile.nip05}
          onClick={() => setPopup("NIP-05 ID")}
        />
        <Item
          title="About"
          value={newProfile.about}
          onClick={() => setPopup("About")}
        />
        <Item
          title="Picture"
          value={newProfile.picture}
          onClick={() => setPopup("Picture")}
        />
        <Item
          title="Banner"
          value={newProfile.banner}
          onClick={() => setPopup("Banner")}
        />
        <Item
          title="Lightning Tips"
          value={newProfile.lud16}
          onClick={() => setPopup("Lightning Tips")}
        />
        {noChanges ? null : (
          <div className="flex gap-2 justify-end items-center mt-4">
            <Button
              color="green"
              size="sm"
              variant="outline"
              onClick={() => setNewProfile(profileInfo)}
            >
              Reset
            </Button>
            <Button color="green" size="sm" onClick={handleSubmitNewProfile}>
              Save
            </Button>
          </div>
        )}
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
        {popup === "Banner" ? (
          <Fragment>
            <img
              src={newProfile.banner}
              className="bg-light-gray w-full h-auto rounded-md object-cover"
              alt=""
            />
            <PopupInput
              label="Banner Image URL"
              minLength={1}
              maxLength={256}
              value={newProfile.banner}
              message={"Picture must be between 1 and 256 characters."}
              onChange={(e) =>
                setNewProfile({ ...newProfile, banner: e.target.value })
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
            {convertedAddress ? (
              <p className="w-full overflow-x-scroll mt-2 py-2">
                {convertedAddress}
              </p>
            ) : null}
          </Fragment>
        ) : null}
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
    <span className="text-gray max-w-[70%] overflow-hidden hover:text-gray-hover whitespace-nowrap text-ellipsis">
      {value}
    </span>
  </button>
);

export default Account;
