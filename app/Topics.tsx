"use client";
import Link from "next/link";
import AsideSection from "./AsideSection";

interface TopicsProps {
  TOPICS: string[];
  title: string;
}

const Topics: React.FC<TopicsProps> = ({ TOPICS, title }) =>
  TOPICS.length > 0 ? (
    <AsideSection title={title}>
      <ul className="flex items-center gap-2 text-sm flex-wrap">
        {TOPICS.map((topic) => (
          <li key={topic}>
            <Link
              className="rounded-full inline-block py-2 px-3 bg-opacity-50 hover:bg-opacity-80 bg-light-gray text-gray-hover"
              href={`/tag/${topic.replace(" ", "-")}`}
            >
              {topic}
            </Link>
          </li>
        ))}
      </ul>
    </AsideSection>
  ) : null;

export default Topics;
