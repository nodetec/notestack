import Popup from "../../Popup";
import { useEffect, useState } from "react";
import Button from "../../Button";
import { useNostr } from "nostr-react";
import type { Event } from "nostr-tools";
import { BsPatchCheckFill, BsLightningChargeFill } from "react-icons/bs";
import { requestInvoice } from "lnurl-pay";
import { utils } from "lnurl-pay";
import { bech32 } from "bech32";
import Link from "next/link";
import { NostrService } from "@/app/lib/nostr";
import Truncate from "../util/Truncate";
import Buttons from "@/app/Buttons";
import FollowButton from "./FollowButton";
import PopupInput from "@/app/PopupInput";

const presetAmounts = [
  { value: "1000", label: "1k" },
  { value: "5000", label: "5k" },
  { value: "10000", label: "10k" },
  { value: "25000", label: "25k" },
];

export default function UserCard({
  name,
  nip05,
  npub,
  about,
  picture,
  profilePubkey,
  loggedInContactList,
  loggedInPubkey,
  lud06,
  lud16,
}: any) {
  const { connectedRelays } = useNostr();
  const { publish } = useNostr();
  let contacts = null;
  if (loggedInContactList) {
    contacts = loggedInContactList.map((pair: string) => pair[1]);
  }
  const [isOpen, setIsOpen] = useState(false);
  const [isTipOpen, setIsTipOpen] = useState(false);
  const [isTipSuccessOpen, setIsTipSuccessOpen] = useState(false);

  const [newName, setNewName] = useState(name);
  const [newAbout, setNewAbout] = useState(about);
  const [newPicture, setNewPicture] = useState(picture);
  const [newNip05, setNewNip05] = useState(nip05);
  const [newLud06, setNewLud06] = useState(lud06);
  const [newLud16, setNewLud16] = useState(lud16);
  const [tipInputValue, setTipInputValue] = useState<string>("1");
  const [tipMessage, setTipMessage] = useState<string>();
  const [paymentHash, setPaymentHash] = useState();
  const [newLnAddress, setNewLnAddress] = useState<any>();
  const [convertedAddress, setConvertedAddress] = useState<any>();
  const [tippedAmount, setTippedAmount] = useState<any>();

  useEffect(() => {
    setNewLnAddress(lud16);
    console.log("NAME:", name);
    console.log("ABOUT:", about);
    console.log("PICTURE:", picture);
    console.log("NIP05:", nip05);
    console.log("LUD06:", lud06);
    console.log("LUD16:", lud16);
    console.log("LNADDRESS:", newLnAddress);
    console.log("CONVERTEDADDRESS:", convertedAddress);
    console.log("TIPPEDAMOUNT:", tippedAmount);
  }, []);

  useEffect(() => {
    setNewLnAddress(lud16);
    setNewName(name);
    setNewAbout(about);
    setNewPicture(picture);
    setNewNip05(nip05);
    setNewLud06(lud06);
    setNewLud16(lud16);
  }, [isOpen]);

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

          setNewLud16(newConvertedAddress);
          setConvertedAddress(newConvertedAddress);
          console.log(newConvertedAddress); // chrisatmachine@getalby.com
        }

        if (utils.isLightningAddress(newLnAddress)) {
          let words = bech32.toWords(Buffer.from(url, "utf8"));
          let newConvertedAddress = "";
          newConvertedAddress = bech32.encode("lnurl", words, 2000);
          setNewLud06(newConvertedAddress);
          setConvertedAddress(newConvertedAddress);
        }
      } catch (error) {
        console.log(error);
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

  useEffect(() => {
    setTipMessage("");
    setTipInputValue("1");
  }, [isTipOpen]);

  const handleClick = async () => {
    setIsOpen(!isOpen);
  };

  const handleTipClick = async () => {
    setIsTipOpen(!isTipOpen);
  };

  const validateTipInputKeyDown = (e: any) => {
    if ((e.which != 8 && e.which != 0 && e.which < 48) || e.which > 57) {
      e.preventDefault();
    }
  };

  const handleSendTip = async (e: any) => {
    e.preventDefault();
    // @ts-ignore
    if (typeof window.webln !== "undefined") {
      const lnUrlOrAddress = lud06 || lud16;

      const { invoice, params, successAction, validatePreimage } =
        await requestInvoice({
          lnUrlOrAddress,
          // @ts-ignore
          tokens: tipInputValue, // satoshis
          comment: tipMessage,
        });
      try {
        // @ts-ignore
        const result = await webln.sendPayment(invoice);
        console.log("Tip Result:", result);
        setTippedAmount(tipInputValue);
        setPaymentHash(result.paymentHash);
      } catch (e) {
        console.log("Tip Error:", e);
      }
    }
    setIsTipOpen(!isTipOpen);
    setIsTipSuccessOpen(!isTipSuccessOpen);
  };

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
        setIsOpen(!isOpen);
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
        setIsOpen(!isOpen);
      });

      pub.on("failed", (reason: any) => {
        // setPost({ postSending: false, postError: reason });
        console.log("OUR EVENT HAS FAILED");
      });
    }
  };

  return (
    <div className="flex flex-col items-center md:items-start gap-4">
      <Link href={`/u/${npub}`}>
        <img
          className="rounded-full mb-4 min-w-[9rem] w-36 h-36 object-cover"
          src={picture}
          alt={name}
        />
      </Link>
      <div className="text-2xl font-bold ">
        <span className="text-red-500">@</span>
        {name}
        {/* BsPatchCheckFill */}
        {nip05 && (
          <div className="text-sm ">
            <div className="flex items-center gap-1">
              <BsPatchCheckFill className="text-blue-500" size="14" />
              <span>{nip05}</span>
            </div>
          </div>
        )}
        {lud16 && utils.isLightningAddress(lud16) && (
          <div className="text-sm ">
            <div className="flex items-center gap-1">
              <span className="whitespace-nowrap">{"⚡ " + lud16}</span>
            </div>
          </div>
        )}
      </div>
      <p className="flex items-center gap-1">
        <Truncate content={npub}  />
      </p>
      <p className="text-sm ">{about}</p>

      {loggedInPubkey &&
        (loggedInPubkey === profilePubkey ? (
          <Buttons>
            <Button
              
              variant="ghost"
              onClick={handleClick}
              size="sm"
            >
              edit profile
            </Button>
          </Buttons>
        ) : (
          <Buttons>
            <FollowButton
              loggedInUserPublicKey={loggedInPubkey}
              currentContacts={loggedInContactList}
              profilePublicKey={profilePubkey}
              contacts={contacts}
            />
            {(lud06 || lud16) && (
              <Button
                
                variant="ghost"
                onClick={handleTipClick}
                size="sm"
                icon={<BsLightningChargeFill size="14" />}
              >
                tip
              </Button>
            )}
          </Buttons>
        ))}

      <Popup
        title="Success"
        isOpen={isTipSuccessOpen}
        setIsOpen={setIsTipSuccessOpen}
      >
        <h4 className="text-lg text-green-500 text-center pb-4">{`You sent ${name} ${tippedAmount} sat(s)!`}</h4>
        <h5 className="text   overflow-x-scroll rounded-md text-center p-4">
          <div className="cursor-text flex justify-start whitespace-nowrap items-center">
            <div className="mr-2">{"Payment Hash:"}</div>
            <div className="pr-4">{paymentHash}</div>
          </div>
        </h5>
      </Popup>
      {loggedInPubkey === profilePubkey ? (
        <Popup title="Edit Profile" isOpen={isOpen} setIsOpen={setIsOpen}>
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
          <h3 className="text-xl  text-center pt-4">
            ⚡ Enable Lightning Tips ⚡
          </h3>
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
      ) : (
        <Popup
          title="Pay with Lightning"
          isOpen={isTipOpen}
          setIsOpen={setIsTipOpen}
        >
          <h2 className="pt-2 font-bold text-lg ">Amount</h2>
          <div className="flex items-center w-full py-2 px-4 rounded-md   ring-1 ring-black-700">
            <input
              type="number"
              value={tipInputValue}
              onKeyDown={validateTipInputKeyDown}
              onChange={(e) => setTipInputValue(e.target.value)}
              placeholder="Enter amount in sats"
              required
              min={1}
              className="w-full flex-1 focus:ring-0 border-0 bg-transparent "
            />
            <span className="text-black-600 text-sm font-bold">satoshis</span>
          </div>
          <Buttons>
            {presetAmounts.map((amount) => (
              <Button
                key={amount.label}
                variant="outline"
                iconAfter
                className="w-full"
                icon={<BsLightningChargeFill size="14" />}
                onClick={() => setTipInputValue(amount.value)}
              >
                {amount.label}
              </Button>
            ))}
          </Buttons>
          <h2 className="pt-2 font-bold text-lg ">Message</h2>
          <div className="flex items-center w-full py-2 px-4 rounded-md   ring-1 ">
            <input
              type="text"
              value={tipMessage}
              onChange={(e) => setTipMessage(e.target.value)}
              placeholder="optional"
              className="w-full flex-1 focus:ring-0 border-0 bg-transparent "
            />
          </div>
          <Button
            
            variant="solid"
            onClick={handleSendTip}
            size="md"
            icon={<BsLightningChargeFill size="14" />}
            className="w-full"
          >
            Send
          </Button>
        </Popup>
      )}
    </div>
  );
}
