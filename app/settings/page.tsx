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

const ARTICLES = [
  "616c252e86c5488faf65b5247800b517f00c658b528435bde12c481c4c0b3f37",
  "f09bb957509a5bcf902e3aa0d8ba6dacfb365595ddcc9a28bc895f0b93be4f79",
  "112f5761e3206b90fc2a5d35b0dd8a667be2ce62721e565f6b1285205d5a8e27",
];

const SettingsPage = () => {
  const TABS = ["Account", "Publishing", "Notifications"];
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);

  return (
    <Main>
      <Content>
        <h1 className="text-5xl font-medium my-12">Settings</h1>
        <Tabs TABS={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="mt-12">
          {activeTab === "Account" && <Account />}
          {activeTab === "Publishing" && <Publishing />}
          {activeTab === "Notifications" && <Notifications />}
        </div>
      </Content>
      <Aside>
        <RecommendedEvents title="Suggested help articles" EVENTS={ARTICLES} />
      </Aside>
    </Main>
  );
};

export default SettingsPage;
