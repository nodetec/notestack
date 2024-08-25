// import { Button } from "~/components/ui/button";
// import { FilterIcon } from "lucide-react";
//
// import { ArticleFeedFilterDropdown } from "./ArticleFeedFilterDropdown";
//
// type Props = {
//   show?: boolean;
// };
//
// export function ArticleFeedControls({ show }: Props) {
//   return (
//     <div className="flex w-full items-center justify-end px-4 md:px-6">
//       <ArticleFeedFilterDropdown>
//         <Button
//           className="bg-accent hover:bg-foreground/20"
//           variant="secondary"
//           size="icon"
//         >
//           <FilterIcon className="h-5 w-5" />
//         </Button>
//       </ArticleFeedFilterDropdown>
//     </div>
//   );
// }

import * as React from "react";

import { Button } from "~/components/ui/button";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ChevronLeft, ChevronRight, PlusIcon } from "lucide-react";

const tabItems = [
  "Featured",
  "Following",
  "Javascript",
  "React",
  "Bitcoin",
  "Lightning",
  "Linux",
  "Programming",
  "Golang",
  "Rust",
];

type Props = {
  show?: boolean;
};

export function ArticleFeedControls({ show }: Props) {
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const tabsRef = React.useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    const { current } = tabsRef;
    if (current) {
      const { scrollLeft, scrollWidth, clientWidth } = current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  React.useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    const { current } = tabsRef;
    if (current) {
      const scrollAmount = current.clientWidth / 2;
      current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <Tabs
      defaultValue="dashboard"
      className="sticky top-0 w-full max-w-3xl bg-secondary px-3 pt-4 md:px-5"
    >
      <div className="relative">
        <ScrollArea className="w-full whitespace-nowrap border-b">
          <TabsList
            ref={tabsRef}
            className="inline-flex w-max items-center justify-start gap-1 rounded-none bg-secondary px-2 py-6"
            onScroll={checkScroll}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-sm px-3 py-0 text-sm font-medium transition-all hover:bg-muted/80 data-[state=active]:text-foreground"
              onClick={() => scroll("left")}
            >
              <PlusIcon className="h-5 w-5 shrink-0" />
            </Button>
            {tabItems.map((item) => (
              <TabsTrigger
                key={item.toLowerCase()}
                value={item.toLowerCase()}
                className="rounded-sm px-2.5 py-1.5 text-sm font-medium transition-all hover:bg-muted/80 data-[state=active]:bg-secondary data-[state=active]:text-foreground"
              >
                {item}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
        {canScrollLeft && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {canScrollRight && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Tabs>
  );
}
