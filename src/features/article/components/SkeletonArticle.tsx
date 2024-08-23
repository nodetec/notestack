import { Skeleton } from "~/components/ui/skeleton";

export function SkeletonArticle() {
  return (
    <>
      <div className="sticky top-0 z-40 mx-auto mb-6 flex max-w-2xl justify-between bg-secondary/95 pb-2 pt-4 backdrop-blur transition-colors duration-500 sm:px-2">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>

      <article className="mx-auto flex max-w-2xl flex-col gap-y-4 px-1">
        <Skeleton className="mb-4 h-10 w-3/4" />

        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="mb-4 h-6 w-full" />

        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="mb-4 h-6 w-full" />

        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="mb-4 h-6 w-full" />

        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="mb-4 h-6 w-full" />
      </article>
    </>
  );
}
