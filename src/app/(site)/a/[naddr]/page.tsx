import { Suspense } from "react";

import { Article, ArticleHeader } from "~/features/article";
import { SkeletonArticle } from "~/features/article/components/SkeletonArticle";

export default async function page({ params }: { params: { naddr: string } }) {
  return (
    <main className="grow px-6 py-4 sm:rounded-lg sm:bg-secondary sm:px-10 sm:shadow-sm sm:ring-1 sm:ring-foreground/10">
      <ArticleHeader naddr={params.naddr} />
      <Suspense fallback={<SkeletonArticle />}>
        <Article naddr={params.naddr} />
      </Suspense>
    </main>
  );
}
