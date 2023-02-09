"use client";
import Popup from "../../Popup";
import { useEffect, useState } from "react";
import Contact from "./Contact";
import Button from "@/app/Button";

export default function FollowingPopup({ pubkeys, isOpen, setIsOpen }: any) {
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
      title="Following"
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      className="h-3/4 max-h-192 opacity-70 inset-0 overflow-auto scroll-smooth border-none"
    >
      <ul>
        {pubkeys &&
          pubkeys
            .slice(0, numFollowing)
            .map((pubkey: any) => <Contact key={pubkey} pubkey={pubkey} />)}
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
