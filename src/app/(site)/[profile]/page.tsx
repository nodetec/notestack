import { Suspense } from "react";

import { ArticleFeed } from "~/features/article-feed";
import { SkeletonArticleFeed } from "~/features/article-feed/components/SkeletonArticleFeed";
import { getUser } from "~/server/auth";
import { getPublicKeyFromNip05OrNpub } from "~/server/nostr";

type Props = {
  profile: string;
};

async function ProfileArticleFeedWrapper({ profile }: Props) {
  const user = await getUser();

  const profilePublicKey = await getPublicKeyFromNip05OrNpub(profile);

  return (
    <ArticleFeed
      userPublicKey={user?.publicKey}
      profilePublicKey={profilePublicKey}
    />
  );
}

export default async function ProfileArticleFeedPage({
  params,
}: {
  params: { profile: string };
}) {
  return (
    <main className="grow px-6 py-4 sm:rounded-lg sm:bg-secondary sm:px-10 sm:shadow-sm sm:ring-1 sm:ring-foreground/10">
      <Suspense fallback={<SkeletonArticleFeed profileFeed />}>
{/* <SkeletonArticleFeed profileFeed /> */}
        <ProfileArticleFeedWrapper profile={params.profile} />
      </Suspense>
    </main>
  );
}
