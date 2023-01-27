"use client";

import Aside from "@/app/Aside";
import Profile from "@/app/components/profile/Profile";
import LatestNotes from "@/app/LatestNotes";
import Main from "@/app/Main";
import { usePathname } from "next/navigation";
import { nip19 } from "nostr-tools";
import { useState } from "react";

export default function ProfilePage() {
  const [name, setName] = useState();
  const pathname = usePathname();

  if (pathname) {
    const npub = pathname.split("/").pop() || "";

    const profilePubkey = nip19.decode(npub).data.valueOf();

    return (
      <Main>
        <LatestNotes name={name} profilePubkey={profilePubkey} />
        <Aside>
          <Profile npub={npub} setName={setName} />
        </Aside>
      </Main>
    );
  } else {
    return <p>Profile not found</p>;
  }
}
