import { ArticleProfileFeed } from "~/features/article-feed/components/ArticleProfileFeed";
import { getUser } from "~/server/auth";
import { getPublicKeyAndRelayHintFromNip05OrNpub } from "~/server/nostr";

export default async function ProfileArticleFeedPage({
  params,
}: {
  params: { profile: string };
}) {
  const user = await getUser();

  const publicKeyAndRelay = await getPublicKeyAndRelayHintFromNip05OrNpub(
    params.profile,
  );

  return (
    <ArticleProfileFeed
      userPublicKey={user?.publicKey}
      profilePublicKey={publicKeyAndRelay?.publicKey}
      nip05HintRelays={publicKeyAndRelay?.relays}
    />
  );
}
