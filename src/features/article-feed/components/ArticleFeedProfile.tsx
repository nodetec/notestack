import { useMemo } from "react";

import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { useProfileEvent } from "~/hooks/useProfileEvent";
import { parseProfileEvent } from "~/lib/events/profile-event";
import { shortNpub } from "~/lib/nostr";
import { getAvatar } from "~/lib/utils";
import { EllipsisVerticalIcon } from "lucide-react";
import Image from "next/image";

type Props = {
  relays: string[];
  publicKey: string;
};

export default function ArticleFeedProfile({ relays, publicKey }: Props) {
  const { data: profileEvent, status } = useProfileEvent(relays, publicKey);

  const profile = useMemo(
    () => (profileEvent ? parseProfileEvent(profileEvent) : null),
    [profileEvent],
  );

  if (status === "pending") {
    return (
      <div className="sticky top-0 mb-2 w-full bg-secondary/95 pt-7 backdrop-blur transition-colors duration-500">
        <div className="flex items-center justify-between px-4 pb-4 md:px-6">
          <div className="flex items-center gap-4">
            <Skeleton className="aspect-square w-10 overflow-hidden rounded-full object-cover" />
            <Skeleton className="h-8 w-36" />
          </div>

          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>

        <div className="w-full px-4 md:px-6">
          <Separator />
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="mb-2 w-full bg-secondary/95 pt-8 backdrop-blur transition-colors duration-500">
        <div className="flex items-center justify-between px-4 pb-4 md:px-6">
          <div className="flex items-center gap-4">
            <Image
              className="aspect-square w-10 overflow-hidden rounded-full object-cover hover:brightness-90"
              src={profile?.content?.picture ?? getAvatar(publicKey)}
              width={48}
              height={48}
              alt=""
              loading="lazy"
            />
            <h2 className="text-2xl font-semibold text-foreground/80">
              {profile?.content.name ?? shortNpub(publicKey)}
            </h2>
          </div>

          {/* <ArticleFeedFilterDropdown> */}
          <Button
            className="bg-accent text-foreground/80 hover:bg-foreground/20"
            variant="secondary"
            size="icon"
          >
            <EllipsisVerticalIcon className="h-5 w-5" />
          </Button>
          {/* </ArticleFeedFilterDropdown> */}
        </div>
      </div>
    );
  }
}
