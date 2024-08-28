import { Article } from "~/features/article";
import { getPublicKeyAndRelayHintFromNip05OrNpub } from "~/server/nostr";
import { notFound } from "next/navigation";

export default async function ArticlePage({
  params,
}: {
  params: { profile: string; identifier: string };
}) {
  if (!params?.identifier) {
    notFound();
  }

  const publicKeyAndRelay = await getPublicKeyAndRelayHintFromNip05OrNpub(
    params.profile,
  );

  const address = {
    identifier: params.identifier,
    pubkey: publicKeyAndRelay.publicKey,
    kind: 30023,
  };

  return <Article address={address} />;
}
