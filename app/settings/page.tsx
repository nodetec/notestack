"use client";

import Aside from "../Aside";
import Content from "../Content";
import Main from "../Main";
import RecommendedEvents from "../RecommendedEvents";
import Tabs from "../Tabs";
import Account from "./Account";
import Notifications from "./Notifications";
import Appearance from "./Appearance";
import Relays from "./Relyas";
import FollowedRelays from "../FollowedRelays";
import { useContext, useEffect, useState } from "react";
import { KeysContext } from "../context/keys-provider";

const SettingsPage = () => {
  const [tabs, setTabs] = useState<string[]>([
    "Relays",
    "Appearance" /* "Notifications" */,
  ]);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>(tabs[0]);

  //@ts-ignore
  const { keys } = useContext(KeysContext);

  useEffect(() => {
    if (keys.publicKey) {
      setTabs((state) => ["Account", ...state]);
    }
  }, [keys]);


  return (
    <Main>
      <Content>
        <h1 className="text-5xl font-medium my-12">Settings</h1>
        {activeTab === "Account" && <FollowedRelays />}
        <Tabs TABS={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="mt-12">
          {activeTab === "Account" && <Account />}
          {activeTab === "Relays" && <Relays />}
          {activeTab === "Appearance" && <Appearance />}
          {activeTab === "Notifications" && <Notifications />}
        </div>
      </Content>
      <Aside>
        <RecommendedEvents title="Suggested help articles" events={[]} />
      </Aside>
    </Main>
  );
};

export default SettingsPage;
