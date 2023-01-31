"use client";

import Aside from "../Aside";
import Content from "../Content";
import Main from "../Main";
import RecommendedEvents from "../RecommendedEvents";

const ARTICLES = [
  "616c252e86c5488faf65b5247800b517f00c658b528435bde12c481c4c0b3f37",
  "f09bb957509a5bcf902e3aa0d8ba6dacfb365595ddcc9a28bc895f0b93be4f79",
  "112f5761e3206b90fc2a5d35b0dd8a667be2ce62721e565f6b1285205d5a8e27",
];

const SettingsPage = () => {
  return (
    <Main>
      <Content></Content>
      <Aside>
        <RecommendedEvents title="Suggested help articles" EVENTS={ARTICLES} />
      </Aside>
    </Main>
  );
};

export default SettingsPage;
