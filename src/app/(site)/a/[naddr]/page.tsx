import { Article } from "~/features/article";
import { getUser } from "~/server/auth";
import { notFound } from "next/navigation";
import { nip19 } from "nostr-tools";

export default async function ArticlePage({
  params,
}: {
  params: { naddr: string };
}) {
  const user = await getUser();

  let decodeResult;

  try {
    decodeResult = nip19.decode(params.naddr);
  } catch (error) {
    console.error("Invalid naddr", params.naddr, error);
    notFound();
  }

  if (!decodeResult) {
    notFound();
  }

  if (decodeResult.type !== "naddr") {
    console.error("Invalid naddr", params.naddr);
    notFound();
  }

  const address = decodeResult.data;

  return <Article address={address} publicKey={user?.publicKey} />;
}
