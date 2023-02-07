"use client";
import Popup from "../../Popup";
import { useEffect } from "react";

export default function FollowersPopup({
  localFollowers,
  isOpen,
  setIsOpen,
}: any) {
  useEffect(() => {
    console.log("LOCAL FOLLOWERS:", localFollowers);
  }, [isOpen]);

  return (
    <Popup
      title="Followers"
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      className="h-3/4 max-h-192 opacity-70 inset-0 overflow-auto scroll-smooth border-none"
    >
      <ul>
        {localFollowers &&
          localFollowers.slice(0, 10).map((follower: any) => {
            return <li>{follower.content}</li>;
          })}
      </ul>
    </Popup>
  );
}
