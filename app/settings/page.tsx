"use client";

import { useState } from "react";
import Aside from "../Aside";
import Content from "../Content";
import Main from "../Main";
import RecommendedEvents from "../RecommendedEvents";
import Tabs from "../Tabs";
import Account from "./Account";
import Notifications from "./Notifications";
import Publishing from "./Publishing";
import Relays from "./Relyas";

const SettingsPage = () => {
  const TABS = ["Account", "Relays" /* , "Publishing", "Notifications" */];
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);

  return (
    <Main>
      <Content>
        <h1 className="text-5xl font-medium my-12">Settings</h1>
        <Tabs TABS={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="mt-12">
          {activeTab === "Account" && <Account />}
          {activeTab === "Relays" && <Relays />}
          {activeTab === "Publishing" && <Publishing />}
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
