"use client";

import Aside from "@/app/Aside";
import Button from "@/app/Button";
import Profile from "@/app/components/profile/Profile";
import LatestArticles from "@/app/LatestArticles";
import { shortenHash } from "@/app/lib/utils";
import Main from "@/app/Main";
import Tabs from "@/app/Tabs";
import { usePathname } from "next/navigation";
import { nip19 } from "nostr-tools";
import { useState } from "react";
import { TbDots } from "react-icons/tb";

export default function ProfilePage() {
  const [name, setName] = useState();
  const TABS = ["Home", "About"];
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>(TABS[0]);
  const pathname = usePathname();

  if (pathname) {
    const npub = pathname.split("/").pop() || "";

    const profilePubkey = nip19.decode(npub).data.valueOf();

    return (
      <Main>
        <div>
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-5xl font-medium my-12">{name || shortenHash(npub)}</h1>
            <Button color="transparent" icon={<TbDots />} />
          </div>
          <Tabs TABS={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
          {activeTab === "Home" ? (
            <LatestArticles name={name} profilePubkey={profilePubkey} />
          ) : activeTab === "About" ? (
            <p>About</p>
          ) : null}
        </div>
        <Aside>
          <Profile npub={npub} setName={setName} />
        </Aside>
      </Main>
    );
  } else {
    return <p>Profile not found</p>;
  }
}
