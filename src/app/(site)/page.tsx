import { ArticleFeed } from "~/features/article-feed";

export default function Home() {
  return (
    <main className="grow p-6 sm:rounded-lg sm:bg-secondary sm:p-10 sm:shadow-sm sm:ring-1 sm:ring-zinc-950/5 dark:sm:ring-white/10">
      <ArticleFeed />
    </main>
  );
}
