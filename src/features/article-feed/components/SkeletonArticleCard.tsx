import { Fragment } from "react";

import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";

export function SkeletonArticleCard() {
  return (
    <Fragment>
      <Card className="w-full border-none bg-secondary shadow-none">
        <CardContent className="flex flex-col px-4 pb-0 pt-4 md:px-6">
          <div className="flex items-center gap-2">
            <Skeleton className="aspect-square w-5 rounded-full" />
            <Skeleton className="h-5 w-20" />
          </div>

          <div className="flex flex-col gap-2 pb-4 pt-4">
            <div className="flex flex-col">
              <div className="flex items-start justify-between sm:items-center">
                <div className="flex flex-col items-start gap-2">
                  <Skeleton className="mb-1 h-7 w-52 sm:w-96 md:w-[28rem]" />
                  <Skeleton className="h-4 w-40 pt-0 sm:w-80 md:w-96" />
                  <Skeleton className="h-4 w-40 pt-0 sm:w-80 md:w-96" />
                  <Skeleton className="mt-5 h-5 w-44 pt-0 sm:w-44 md:w-44" />
                </div>

                <Skeleton className="ml-2 h-14 w-20 rounded-md md:ml-14 md:h-28 md:w-40" />

                {/* <Skeleton className="mt-5 h-5 w-44 pt-0 sm:w-44 md:w-44 sm:hidden" /> */}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="w-full px-4 md:px-6">
        <Separator />
      </div>
    </Fragment>

    // <Fragment>
    //   <Card className="w-full border-none bg-secondary shadow-none">
    //     <CardContent className="flex flex-col px-4 pb-0 pt-4 md:px-6">
    //       <div className="flex flex-col gap-2">
    //       </div>
    //
    //     </CardContent>
    //   </Card>
    //   <div className="w-full px-4 md:px-6">
    //     <Separator />
    //   </div>
    // </Fragment>
  );
}
