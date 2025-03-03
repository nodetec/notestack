import { Button } from "~/components/ui/button";
import { ListFilterIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { ArticleFeedFilterDropdown } from "./ArticleFeedFilterDropdown";

type Props = {
  show?: boolean;
};

export function ArticleFeedControls({ show }: Props) {
  const searchParams = useSearchParams();

  function getFeedTitle() {
    const feed = searchParams.get("feed");
    if (feed === "following") {
      return "Following";
    }
    if (feed === "latest") {
      return "Latest";
    }
    return "Featured";
  }

  if (!show) {
    return null;
  }

  return (
    <div className="mb-2 w-full bg-secondary/95 pt-8 backdrop-blur transition-colors duration-500">
      <div className="flex items-center justify-between px-4 pb-4 md:px-6">
        <h2 className="text-[1.65rem] font-semibold text-foreground/80">
          {getFeedTitle()}
        </h2>
        <ArticleFeedFilterDropdown>
          <Button
            className="bg-accent text-foreground/80 hover:bg-foreground/20"
            variant="secondary"
            size="icon"
          >
            <ListFilterIcon className="h-5 w-5" />
          </Button>
        </ArticleFeedFilterDropdown>
      </div>
    </div>
  );
}
