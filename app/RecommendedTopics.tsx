"use client";
import Link from "next/link";
import AsideSection from "./AsideSection";

const TOPICS = [
  "nostr",
  "Lightning",
  "blogstack",
  "Programming",
  "TailwindCSS",
  "Chess",
];

const RecommendedTopics = () => (
  <AsideSection title="Recommended Topics">
    <ul className="flex items-center gap-2 text-sm flex-wrap">
      {TOPICS.map((topic) => (
        <li key={topic}>
          <Link
            className="rounded-full inline-block py-2 px-3 bg-opacity-50 hover:bg-opacity-80 bg-light-gray text-gray-hover"
            href={`/tag/${topic.replace(" ", "-").toLowerCase()}`}
          >
            {topic}
          </Link>
        </li>
      ))}
    </ul>
  </AsideSection>
);

export default RecommendedTopics;
