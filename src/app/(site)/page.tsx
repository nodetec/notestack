import { Suspense } from "react";

import { ArticleFeed } from "~/features/article-feed";
import { SkeletonArticleFeed } from "~/features/article-feed/components/SkeletonArticleFeed";
import { getUser } from "~/server/auth";

async function ArticleFeedWrapper() {
  const user = await getUser();

  return <ArticleFeed userPublicKey={user?.publicKey} />;
}

export default async function ArticleFeedPage() {
  return (
    <main className="grow bg-secondary p-2 sm:rounded-lg sm:p-10 sm:shadow-sm sm:ring-1 sm:ring-foreground/10">
      <Suspense fallback={<SkeletonArticleFeed />}>
        <ArticleFeedWrapper />
      </Suspense>
    </main>
  );
}
