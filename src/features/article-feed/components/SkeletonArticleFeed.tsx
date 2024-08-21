import { SkeletonArticleCard } from "./SkeletonArticleCard";

export function SkeletonArticleFeed() {
  return (
    <div className="min-w-3xl mx-auto mt-12 flex w-full max-w-3xl flex-col items-center gap-y-8">
      <SkeletonArticleCard id="1" />
      <SkeletonArticleCard id="1" />
      <SkeletonArticleCard id="1" />
      <SkeletonArticleCard id="1" />
    </div>
  );
}
