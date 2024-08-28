import { Suspense } from "react";

import { ArticleFeed } from "~/features/article-feed";
import { SkeletonArticleFeed } from "~/features/article-feed/components/SkeletonArticleFeed";
import { getUser } from "~/server/auth";
import { getPublicKeyAndRelayHintFromNip05OrNpub } from "~/server/nostr";

type Props = {
  profile: string;
};

async function ProfileArticleFeedWrapper({ profile }: Props) {
  const user = await getUser();

  const publicKeyAndRelay =
    await getPublicKeyAndRelayHintFromNip05OrNpub(profile);

  return (
    <ArticleFeed
      userPublicKey={user?.publicKey}
      profilePublicKey={publicKeyAndRelay?.publicKey}
      nip05HintRelays={publicKeyAndRelay?.relays}
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
