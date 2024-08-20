import { Suspense } from "react";

import { ArticleFeed } from "~/features/article-feed";

export default async function Home() {
  return (
    <main className="grow bg-secondary p-2 sm:rounded-lg sm:p-10 sm:shadow-sm sm:ring-1 sm:ring-zinc-950/5 dark:sm:ring-white/10">
      <Suspense fallback={<div className="h-screen"></div>}>
        <ArticleFeed />
      </Suspense>
    </main>
  );
}
