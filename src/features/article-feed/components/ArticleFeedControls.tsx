import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { ListFilterIcon } from "lucide-react";

import { ArticleFeedFilterDropdown } from "./ArticleFeedFilterDropdown";

type Props = {
  show?: boolean;
};

export function ArticleFeedControls({ show }: Props) {

  if (!show) {
    return null;
  }

  return (
    <div className="sticky top-0 mb-2 w-full bg-secondary/95 pt-4 backdrop-blur transition-colors duration-500">
      <div className="flex items-center justify-between px-4 pb-4 md:px-6">
        <h2 className="text-2xl font-semibold text-foreground/80">Featured</h2>
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
      <div className="w-full px-4 md:px-6">
        <Separator />
      </div>
    </div>
  );
}

// import * as React from "react";
//
// import { Button } from "~/components/ui/button";
// import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
// import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
// import { ChevronLeft, ChevronRight, PlusIcon } from "lucide-react";
//
// const tabItems = [
//   "Featured",
//   "Following",
//   "Javascript",
//   "React",
//   "Bitcoin",
//   "Lightning",
//   "Linux",
//   "Programming",
//   "Golang",
//   "Rust",
// ];
//
// type Props = {
//   show?: boolean;
// };
//
// export function ArticleFeedControls({ show }: Props) {
//   return (
//     <Tabs
//       defaultValue="dashboard"
//       className="sticky top-0 w-full max-w-3xl bg-secondary px-3 pt-4 md:px-5"
//     >
//       <div className="relative">
//         <ScrollArea className="w-full whitespace-nowrap border-b">
//           <TabsList className="inline-flex w-max items-center justify-start gap-1 rounded-none bg-secondary px-2 py-6">
//             <Button
//               variant="ghost"
//               size="icon"
//               className="h-8 w-8 rounded-sm px-3 py-0 text-sm font-medium transition-all hover:bg-muted/80 data-[state=active]:text-foreground"
//             >
//               <PlusIcon className="h-5 w-5 shrink-0" />
//             </Button>
//             {tabItems.map((item) => (
//               <TabsTrigger
//                 key={item.toLowerCase()}
//                 value={item.toLowerCase()}
//                 className="rounded-sm px-2.5 py-1.5 text-sm font-medium transition-all hover:bg-muted/80 data-[state=active]:bg-secondary data-[state=active]:text-foreground"
//               >
//                 {item}
//               </TabsTrigger>
//             ))}
//           </TabsList>
//           <ScrollBar orientation="horizontal" className="invisible" />
//         </ScrollArea>
//       </div>
//     </Tabs>
//   );
// }
