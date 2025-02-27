import { Button } from "~/components/ui/button";
import { readingTime } from "~/lib/markdown";
import { formatEpochTime } from "~/lib/utils";
import { EllipsisIcon } from "lucide-react";
import { type Event } from "nostr-tools";

import { ArticleCardDropdown } from "./ArticleCardDropdown";

type Props = {
  articleEvent: Event;
  userPublicKey?: string;
};

export function ArticleCardFooter({ articleEvent, userPublicKey }: Props) {
  return (
    <div className="flex w-full justify-between text-sm text-muted-foreground">
      <div className="flex gap-1">
        <div className="text-muted-foreground">
          {formatEpochTime(articleEvent.created_at)}
        </div>
        <span>•</span>
        <span>{readingTime(articleEvent?.content)}</span>
        {/* <div className="flex items-center gap-1 text-muted-foreground"> */}
        {/*   <ZapIcon className="h-4 w-4" /> */}
        {/*   33.1k */}
        {/* </div> */}
        {/* <div className="flex items-center gap-1 text-muted-foreground"> */}
        {/*   <MessageCircle className="h-4 w-4" /> */}
        {/*   42 */}
        {/* </div> */}
      </div>

      {userPublicKey && (
        <ArticleCardDropdown articleEvent={articleEvent}>
          <Button
            className="z-20 h-6 w-6 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-transparent"
            variant="ghost"
            size="icon"
          >
            <EllipsisIcon className="h-5 w-5" />
          </Button>
        </ArticleCardDropdown>
      )}
    </div>
  );
}
