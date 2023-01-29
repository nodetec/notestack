"use client";

import About from "@/app/About";
import Aside from "@/app/Aside";
import BlogFeed from "@/app/BlogFeed";
import Button from "@/app/Button";
import Profile from "@/app/components/profile/Profile";
import Content from "@/app/Content";
import { NotifyContext } from "@/app/context/notify-provider";
import useCopy from "@/app/hooks/useCopy";
import { shortenHash } from "@/app/lib/utils";
import Main from "@/app/Main";
import Tabs from "@/app/Tabs";
import Tooltip from "@/app/Tooltip";
import { usePathname } from "next/navigation";
import { nip19 } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import { BiDotsHorizontalRounded } from "react-icons/bi";

export default function ProfilePage() {
  const [profileInfo, setProfileInfo] = useState({
    name: "",
    about: "",
    picture: "",
  });
  const TABS = ["Home", "About"];
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const { copyToClipboard, isCopied, isError } = useCopy();
  const { setNotifyMessage } = useContext(NotifyContext);
  const pathname = usePathname();

  useEffect(() => {
    if (isCopied) {
      setNotifyMessage("Link copied");
    }
    if (isError) {
      setNotifyMessage("Error copying link");
    }
  }, [isCopied, isError, setNotifyMessage]);

  if (pathname) {
    const npub = pathname.split("/").pop() || "";
    const profilePubkey = nip19.decode(npub).data.valueOf();

    const initialFilter = {
      kinds: [2222],
      authors: [profilePubkey],
      limit: 100,
      until: undefined,
    };

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
              Component={
                <Button
                  color="transparent"
                  variant="ghost"
                  size="sm"
                  icon={<BiDotsHorizontalRounded size="24" />}
                />
              }
            >
              <div className="flex flex-col gap-3 w-max">
                <Button
                  variant="ghost"
                  color="transparent"
                  size="xs"
                  onClick={() => copyToClipboard(npub)}
                >
                  Copy link to profile
                </Button>
                <Button
                  color="transparent"
                  size="xs"
                  onClick={() =>
                    setNotifyMessage("click the ⚡ button under the user card")
                  }
                >
                  Support this author
                </Button>
              </div>
            </Tooltip>
          </div>
          <Tabs TABS={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
          {activeTab === "Home" ? (
            <BlogFeed
              profilePubkey={profilePubkey}
              initialFilter={initialFilter}
              profile={false}
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
