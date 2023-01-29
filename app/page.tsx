"use client";
import Aside from "./Aside";
import BlogFeed from "./BlogFeed";
import Content from "./Content";
import Main from "./Main";
import RecommendedEvents from "./RecommendedEvents";
import RecommendedTopics from "./RecommendedTopics";

export default function HomePage() {
  const initialFilter = {
    kinds: [2222],
    limit: 100,
    authors: undefined,
    until: undefined,
  };

  return (
    <Main>
      <Content>
        <BlogFeed initialFilter={initialFilter} />
      </Content>
      <Aside>
        <RecommendedEvents />
        <RecommendedTopics />
      </Aside>
    </Main>
  );
}
