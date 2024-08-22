import { Skeleton } from "~/components/ui/skeleton";

export async function SkeletonArticle() {
  return (
    <article className="flex flex-col mx-auto gap-y-4 px-1 max-w-2xl">
        <Skeleton className="h-10 w-3/4 mb-4" />

        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full mb-4" />

        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full mb-4" />

        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full mb-4" />

        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full mb-4" />
    </article>
  );
}
