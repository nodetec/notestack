"use client";
import BlogFeed from "./BlogFeed";
import Content from "./Content";

export default function HomePage() {
  const initialFilter = {
    kinds: [2222],
    limit: 100,
    authors: undefined,
    until: undefined,
  };

  return (
    <Content>
      <div className="mt-16">
        <BlogFeed initialFilter={initialFilter} />;
      </div>
    </Content>
  );
}
