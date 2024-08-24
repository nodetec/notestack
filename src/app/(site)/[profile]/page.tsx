import { Suspense } from "react";

import { ArticleFeed } from "~/features/article-feed";
import { SkeletonArticleFeed } from "~/features/article-feed/components/SkeletonArticleFeed";
import { getUser } from "~/server/auth";
import { notFound } from "next/navigation";
import { nip19 } from "nostr-tools";
import { queryProfile } from "nostr-tools/nip05";

type Props = {
  profile: string;
};

async function ProfileArticleFeedWrapper({ profile }: Props) {
  const user = await getUser();

  profile = decodeURIComponent(profile);

  let profilePublicKey;

  if (!profile) {
    console.error("Invalid profile", profile);
    notFound();
  }

  if (profile.startsWith("npub")) {
    try {
      const decodeResult = nip19.decode(profile);
      profilePublicKey = decodeResult.data as string;
    } catch (error) {
      console.error("Invalid npub", profile, error);
      notFound();
    }
  }

  if (!profilePublicKey) {
    const nip05Profile = await queryProfile(profile);
    profilePublicKey = nip05Profile?.pubkey;
    // const profileRelays = nip05Profile?.relays; // TODO: make use of this
  }

  if (!profilePublicKey) {
    console.error("Invalid profile", profile);
    notFound();
  }

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
    <main className="grow bg-secondary p-2 sm:rounded-lg sm:p-10 sm:shadow-sm sm:ring-1 sm:ring-foreground/10">
      <Suspense fallback={<SkeletonArticleFeed />}>
        <ProfileArticleFeedWrapper profile={params.profile} />
      </Suspense>
    </main>
  );
}
