import Popup from "../../Popup";
import { useContext, useEffect, useState } from "react";
import Button from "../../Button";
import type { Event, Relay } from "nostr-tools";
import { BsPatchCheckFill, BsLightningChargeFill } from "react-icons/bs";
import { requestInvoice } from "lnurl-pay";
import { utils } from "lnurl-pay";
import Link from "next/link";
import Buttons from "@/app/Buttons";
import FollowButton from "./FollowButton";
import AccountSettings from "@/app/AccountSettings";
import { UserContext } from "@/app/context/user-provider";
import { RelayContext } from "@/app/context/relay-provider";
import { NostrService } from "@/app/lib/nostr";

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
  lud06,
  lud16,
}: any) {
  let contacts = null;
  if (loggedInContactList) {
    contacts = loggedInContactList.map((pair: string) => pair[1]);
  }

  const [loggedInPubkey, setLoggedInPubkey] = useState<any>();

  // @ts-ignore
  const { activeRelay } = useContext(RelayContext);

  const [isOpen, setIsOpen] = useState(false);
  const [isTipOpen, setIsTipOpen] = useState(false);
  const [isTipSuccessOpen, setIsTipSuccessOpen] = useState(false);
  const [tipInputValue, setTipInputValue] = useState<string>("1");
  const [tipMessage, setTipMessage] = useState<string>();
  const [paymentHash, setPaymentHash] = useState();
  const [tippedAmount, setTippedAmount] = useState<any>();
  const [followers, setFollowers] = useState<Event[]>([]);

  // @ts-ignore
  const { user } = useContext(UserContext);

  useEffect(() => {
    console.log("USER PUBLIC KEY:", user.pubkey);
    console.log("USER!!!!! :", user);

    if (!activeRelay) return;
    if (!user) return;
    let relayUrl = activeRelay.url.replace("wss://", "");
    if (!user[`user_${relayUrl}`]) return;
    setLoggedInPubkey(user[`user_${relayUrl}`].pubkey);
  }, [user, isOpen, activeRelay]);

  // TODO: implement caching
  useEffect(() => {
    if (activeRelay) {
      let eventArray: Event[] = [];
      let sub = activeRelay.sub([
        {
          kinds: [3],
          "#p": [profilePubkey],
          limit: 100,
        },
      ]);

      sub.on("event", (event: Event) => {
        eventArray.push(event);
      });

      sub.on("eose", () => {
        console.log("EOSE additional events from", activeRelay.url);
        const filteredEvents = NostrService.filterEvents(eventArray);
        if (filteredEvents.length > 0) {
          setFollowers(filteredEvents);
        } else {
          setFollowers([]);
        }
        sub.unsub();
      });
    }
  }, [activeRelay]);

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
      <div
        // className="text-base text-gray hover:text-gray-hover my-2"
        className="text-base text-gray my-2"
        // href={`/u/${npub}`}
      >
        {followers && followers.length > 100 ? "100+" : followers.length}{" "}
        Followers
      </div>
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
      {loggedInPubkey &&
        (loggedInPubkey === profilePubkey ? (
          <Buttons>
            <Button
              color="green"
              variant="ghost"
              onClick={handleClick}
              size="xs"
            >
              Edit profile
            </Button>
          </Buttons>
        ) : (
          <div className="flex items-center gap-2">
            <FollowButton
              loggedInUserPublicKey={loggedInPubkey}
              currentContacts={loggedInContactList}
              profilePublicKey={profilePubkey}
              contacts={contacts}
            />
            {(lud06 || lud16) && (
              <Button
                color="red"
                variant="solid"
                onClick={handleTipClick}
                icon={<BsLightningChargeFill />}
                title="tip"
              />
            )}
          </div>
        ))}
      <Popup
        title="Success"
        isOpen={isTipSuccessOpen}
        setIsOpen={setIsTipSuccessOpen}
      >
        <h4 className="text-lg text-green-500 text-center pb-4">{`You sent ${name} ${tippedAmount} sat(s)!`}</h4>
        <h5 className="text overflow-x-scroll rounded-md text-center p-4">
          <div className="cursor-text flex justify-start whitespace-nowrap items-center">
            <div className="mr-2">{"Payment Hash:"}</div>
            <div className="pr-4">{paymentHash}</div>
          </div>
        </h5>
      </Popup>
      {loggedInPubkey === profilePubkey ? (
        <AccountSettings
          name={name}
          nip05={nip05}
          about={about}
          picture={picture}
          loggedInPubkey={loggedInPubkey}
          lud06={lud06}
          lud16={lud16}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />
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
              className="outline-none w-full flex-1 focus:ring-0 border-0 bg-transparent "
            />
            <span className="text-black-600 text-sm ml-2 font-bold">
              satoshis
            </span>
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
              className="outline-none w-full flex-1 focus:ring-0 border-0 bg-transparent "
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
