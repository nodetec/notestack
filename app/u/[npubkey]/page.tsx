"use client";

import About from "@/app/About";
import Aside from "@/app/Aside";
import Button from "@/app/Button";
import Profile from "@/app/components/profile/Profile";
import Content from "@/app/Content";
import LatestArticles from "@/app/LatestArticles";
import { shortenHash } from "@/app/lib/utils";
import Main from "@/app/Main";
import Tabs from "@/app/Tabs";
import Tooltip from "@/app/Tooltip";
import { usePathname } from "next/navigation";
import { nip19 } from "nostr-tools";
import { useState } from "react";
import { TbDots } from "react-icons/tb";

export default function ProfilePage() {
  const [profileInfo, setProfileInfo] = useState({
    name: "",
    about: "",
    picture: "",
  });
  const TABS = ["Home", "About"];
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>(TABS[0]);
  const pathname = usePathname();

  if (pathname) {
    const npub = pathname.split("/").pop() || "";
    const profilePubkey = nip19.decode(npub).data.valueOf();

    return (
      <Main>
        <Content>
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-5xl font-medium my-12">
              {profileInfo.name || shortenHash(npub)}
            </h1>
            <Tooltip
              direction="bottom"
              showOn="click"
              Component={<Button color="transparent" icon={<TbDots />} />}
            >
              <p>hi</p>
            </Tooltip>
          </div>
          <Tabs TABS={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
          {activeTab === "Home" ? (
            <LatestArticles
              name={profileInfo.name}
              profilePubkey={profilePubkey}
            />
          ) : activeTab === "About" ? (
            <About about={profileInfo.about} />
          ) : null}
        </Content>
        <Aside>
          <Profile npub={npub} setProfileInfo={setProfileInfo} />
        </Aside>
      </Main>
    );
  } else {
    return <p>Profile not found</p>;
  }
}
