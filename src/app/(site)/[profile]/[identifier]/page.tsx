import { Article } from "~/features/article";
import { getUser } from "~/server/auth";
import { getPublicKeyFromNip05OrNpub } from "~/server/nostr";
import { notFound } from "next/navigation";

export default async function ArticlePage({
  params,
}: {
  params: { profile: string; identifier: string };
}) {
  const user = await getUser();

  if (!params?.identifier) {
    notFound();
  }

  const profilePublicKey = await getPublicKeyFromNip05OrNpub(params.profile);

  const address = {
    identifier: params.identifier,
    pubkey: profilePublicKey,
    kind: 30023,
  };

  return <Article address={address} publicKey={user?.publicKey} />;
}
