"use client";
import Popup from "../../Popup";
import { useEffect, useState } from "react";
import Contact from "./Contact";
import Button from "@/app/Button";

export default function FollowingPopup({ pubkeys, isOpen, setIsOpen, followingCount }: any) {
  useEffect(() => {
    console.log("FOLLOWING:", pubkeys);
    return () => {
      setNumfollowing(10);
    };
  }, [isOpen]);

  const [numFollowing, setNumfollowing] = useState(10);

  const handleShowMore = () => {
    setNumfollowing(numFollowing + 10);
  };

  return (
    <Popup
      title={`${followingCount} Following`}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      className="max-w-[40rem] h-full max-h-192 inset-0 overflow-x-hidden scroll-smooth border-none scrollbar-hide"
    >
      <ul>
        {pubkeys &&
          pubkeys
            .slice(0, numFollowing)
            .map((pubkey: any) => <Contact key={pubkey} pubkey={pubkey} isPopup={true} />)}
      </ul>

      {pubkeys && pubkeys.length > numFollowing && (
        <Button
          color="green"
          variant="ghost"
          onClick={handleShowMore}
          size="xs"
        >
          Show more
        </Button>
      )}
    </Popup>
  );
}
