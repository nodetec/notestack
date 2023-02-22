"use client";
import Link from "next/link";
import AsideSection from "./AsideSection";
import Skeleton from "./components/Skeleton/Skeleton";

interface TopicsProps {
  TOPICS: string[];
  title: string;
  isEventsLoading?: boolean;
}

const Topics: React.FC<TopicsProps> = ({
  TOPICS,
  title,
  isEventsLoading = false,
}) => (
  <AsideSection title={title}>
    <ul className="flex items-center gap-2 text-sm flex-wrap pt-2">
      {isEventsLoading
        ? Array.from(Array(7)).map((_, i) => (
            <Skeleton
              key={i}
              className="h-8 rounded-full"
              style={{ width: `${i > 2 ? i * 15 + 35 : 85}px` }}
            />
          ))
        : TOPICS.map((topic) => (
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
);

export default Topics;
