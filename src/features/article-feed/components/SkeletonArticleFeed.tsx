import { Skeleton } from "~/components/ui/skeleton";

import { SkeletonArticleCard } from "./SkeletonArticleCard";

type Props = {
  profileFeed?: boolean;
};

export function SkeletonArticleFeed({ profileFeed }: Props) {
  return (
    <div className="min-w-3xl pt-8 mx-auto flex w-full max-w-3xl flex-col items-center gap-y-4">
      <div className="mb-2 w-full bg-secondary/95 backdrop-blur transition-colors duration-500">
        <div className="flex items-center justify-between px-4 pb-4 md:px-6">
          <div className="flex items-center gap-4">
            {profileFeed && (
              <Skeleton className="aspect-square w-10 overflow-hidden rounded-full object-cover" />
            )}
            <Skeleton className="h-8 w-36" />
          </div>

          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
      <SkeletonArticleCard />
      <SkeletonArticleCard />
      <SkeletonArticleCard />
      <SkeletonArticleCard />
    </div>
  );
}
