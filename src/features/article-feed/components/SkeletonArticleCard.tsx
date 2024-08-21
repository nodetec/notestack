import { Fragment } from "react";

import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";

type Props = {
  id: string;
};

export function SkeletonArticleCard({ id }: Props) {
  return (
    <Fragment key={id}>
      <Card className="w-full border-none bg-secondary shadow-none">
        <CardContent className="flex items-center justify-between p-4 md:p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="aspect-square w-5 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="mt-2 h-5 w-52 sm:w-96 md:w-[28rem]" />
            <Skeleton className="mt-2 h-3 w-40 pt-0 sm:w-80 md:w-96" />
            <Skeleton className="mt-2 h-3 w-40 pt-0 sm:w-80 md:w-96" />
          </div>

          <Skeleton className="ml-2 h-14 w-20 rounded-md md:ml-14 md:h-28 md:w-40" />
        </CardContent>
      </Card>
      <div className="w-full px-4">
        <Separator />
      </div>
    </Fragment>
  );
}
