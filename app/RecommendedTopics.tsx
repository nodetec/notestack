import Link from "next/link";

const TOPICS = [
  "nostr",
  "Lightning",
  "blogstack",
  "Programming",
  "TailwindCSS",
  "Chess",
];

const RecommendedTopics = () => (
  <div>
    <h2 className="text-sm font-medium">Recommended Topics</h2>
    <ul className="flex items-center gap-2 text-sm flex-wrap mt-2">
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
  </div>
);

export default RecommendedTopics;
