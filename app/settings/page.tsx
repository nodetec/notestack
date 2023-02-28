"use client";

import { useState } from "react";
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

const SettingsPage = () => {
  const TABS = ["Account", "Relays", "Appearance" /* "Notifications" */];
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);

  return (
    <Main>
      <Content>
        <h1 className="text-5xl font-medium my-12">Settings</h1>
        {activeTab === "Account" && <FollowedRelays />}
        <Tabs TABS={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
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
