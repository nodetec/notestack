import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";

import { SkeletonArticleCard } from "./SkeletonArticleCard";

type Props = {
  profileFeed?: boolean;
};

export function SkeletonArticleFeed({ profileFeed }: Props) {
  return (
    <div className="min-w-3xl mx-auto mt-12 flex w-full max-w-3xl flex-col items-center gap-y-4">
      {profileFeed && (
        <div className="flex w-full flex-col gap-12 px-4 pb-6 md:px-6">
          <div className="flex items-center gap-4">
            <Skeleton className="aspect-square w-12 overflow-hidden rounded-full object-cover" />
            <Skeleton className="h-8 w-36" />
          </div>

          <div className="w-full">
            <Separator />
          </div>
        </div>
      )}
      <SkeletonArticleCard />
      <SkeletonArticleCard />
      <SkeletonArticleCard />
      <SkeletonArticleCard />
    </div>
  );
}
