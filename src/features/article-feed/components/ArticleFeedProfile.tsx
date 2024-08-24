import { useQuery } from "@tanstack/react-query";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { getProfile, shortNpub } from "~/lib/nostr";
import { getAvatar } from "~/lib/utils";
import { type Profile } from "~/types";
import Image from "next/image";

type Props = {
  relays: string[];
  publicKey: string;
};

export default function ArticleFeedProfile({ relays, publicKey }: Props) {
  const { data: profile, status } = useQuery<Profile>({
    queryKey: ["profile", publicKey],
    refetchOnWindowFocus: false,
    queryFn: () => getProfile(relays ?? DEFAULT_RELAYS, publicKey),
  });

  if (status === "pending") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Skeleton className="aspect-square w-5 overflow-hidden rounded-full object-cover" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex w-full flex-col gap-12 pb-6 px-4 md:px-6">
        <div className="flex gap-4 items-center">
          <Image
            className="aspect-square w-12 overflow-hidden rounded-full object-cover hover:brightness-90"
            src={profile?.picture ?? getAvatar(publicKey)}
            width={48}
            height={48}
            alt=""
          />
          <span className="text-2xl">
            {profile?.name ?? shortNpub(publicKey)}
          </span>
        </div>

        <div className="w-full">
          <Separator />
        </div>
      </div>
    );
  }
}
