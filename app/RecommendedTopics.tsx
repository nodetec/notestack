import Link from "next/link";

const TOPICS = [
  "nostr",
  "Lightning",
  "blogstack",
  "Programming",
  "TailwindCSS",
  "Chess",
];

const RecommendedTopics = () => {
  return (
    <div>
      <h2 className="text-sm font-medium">Recommended Topics</h2>
      <ul className="flex items-center gap-2 text-sm flex-wrap mt-2">
        {TOPICS.map((topic) => (
          <li key={topic}>
            <Link
              className="rounded-full inline-block py-2 px-3 bg-opacity-70 hover:bg-opacity-100 bg-light-gray text-gray-hover"
              href={`/tag/${topic}`}
            >
              {topic}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecommendedTopics;
