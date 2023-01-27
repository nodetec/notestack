"use client";

import Profile from "@/app/components/profile/Profile";
import LatestNotes from "@/app/LatestNotes";
import { usePathname } from "next/navigation";
import { nip19 } from "nostr-tools";
import { useState } from "react";

export default function ProfilePage() {
  const pathname = usePathname();

  if (pathname) {
    const npub = pathname.split("/").pop() || "";

    const profilePubkey = nip19.decode(npub).data.valueOf();

    const [name, setName] = useState();
    return (
      <div className="flex flex-col md:flex-row items-center md:items-start md:gap-10 lg:gap-30 lg:px-20 flex-1 justify-center">
        <div className="flex justify-end">
          <LatestNotes name={name} profilePubkey={profilePubkey} />
        </div>
        <Profile npub={npub} setName={setName} />
      </div>
    );
  } else {
    return <p>Profile not found</p>;
  }
}
