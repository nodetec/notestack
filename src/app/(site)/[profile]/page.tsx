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

export default function ProfileArticleFeedPage({
  params,
}: {
  params: { profile: string };
}) {
  return (
    <Suspense fallback={<SkeletonArticleFeed profileFeed />}>
      <ProfileArticleFeedWrapper profile={params.profile} />
    </Suspense>
  );
}
