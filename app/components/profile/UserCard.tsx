import Popup from "../../Popup";
import { useEffect, useState } from "react";
import Button from "../../Button";
import { useNostrEvents } from "nostr-react";
import type { Event } from "nostr-tools";
import { BsPatchCheckFill, BsLightningChargeFill } from "react-icons/bs";
import { requestInvoice } from "lnurl-pay";
import { utils } from "lnurl-pay";
import Link from "next/link";
import Buttons from "@/app/Buttons";
import FollowButton from "./FollowButton";

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
  let contacts = null;
  if (loggedInContactList) {
    contacts = loggedInContactList.map((pair: string) => pair[1]);
  }
  const [isTipOpen, setIsTipOpen] = useState(false);
  const [isTipSuccessOpen, setIsTipSuccessOpen] = useState(false);
  console.log("NAME:", name)
  console.log("ABOUT:", about)

  const [tipInputValue, setTipInputValue] = useState<string>("1");
  const [tipMessage, setTipMessage] = useState<string>();
  const [paymentHash, setPaymentHash] = useState();
  const [tippedAmount, setTippedAmount] = useState<any>();

  // each object in the event array is a unique follower and we can look each one up with a 0 metadata kind
  // const followersEventString = sessionStorage.getItem(
  //   profilePubkey + "_followers"
  // );
  let followers: Event[];

  // if (!followersEventString) {
  // TODO rewrite this, get events without hook and cache
  let { events: followersFromEvent } = useNostrEvents({
    filter: {
      kinds: [3],
      "#p": [profilePubkey],
      limit: 100,
    },
  });
  followers = followersFromEvent;
  // }

  // if (followersEventString) {
  //   const cachedEvents = JSON.parse(followersEventString);
  //   followers = cachedEvents;
  //   console.log("using cached followers for user:", npub);
  // } else {
  //   if (followers && followers.length > 0) {
  //     const followersString = JSON.stringify(followers);
  //     sessionStorage.setItem(profilePubkey + "_followers", followersString);
  //   }
  // }

  useEffect(() => {
    setTipMessage("");
    setTipInputValue("1");
  }, [isTipOpen]);

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
      <Link
        className="text-base text-gray hover:text-gray-hover my-2"
        href={`/u/${npub}`}
      >
        {followers && followers.length > 100 ? "100+" : followers.length}{" "}
        Followers
      </Link>
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
            <Link
              href="/settings"
              className="text-green hover:text-green-hover"
            >
              Edit profile
            </Link>
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
      {loggedInPubkey === profilePubkey ? null : (
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
