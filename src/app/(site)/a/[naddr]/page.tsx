import { Suspense } from "react";

import { Article } from "~/features/article";
import { SkeletonArticle } from "~/features/article/components/SkeletonArticle";
import { getUser } from "~/server/auth";
import { notFound } from "next/navigation";
import { nip19 } from "nostr-tools";

type Props = {
  naddr: string;
};

async function ArticleWrapper({ naddr }: Props) {
  const user = await getUser();

  let decodeResult;

  try {
    decodeResult = nip19.decode(naddr);
  } catch (error) {
    console.error("Invalid naddr", naddr, error);
    notFound();
  }

  if (!decodeResult) {
    notFound();
  }

  if (decodeResult.type !== "naddr") {
    console.error("Invalid naddr", naddr);
    notFound();
  }

  const address = decodeResult.data;

  return <Article address={address} publicKey={user?.publicKey} />;
}

export default async function ArticlePage({
  params,
}: {
  params: { naddr: string };
}) {
  return (
    <main className="grow px-6 py-4 sm:rounded-lg sm:bg-secondary sm:px-10 sm:shadow-sm sm:ring-1 sm:ring-foreground/10">
      <Suspense fallback={<SkeletonArticle />}>
        <ArticleWrapper naddr={params.naddr} />
      </Suspense>
    </main>
  );
}
