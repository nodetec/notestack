import { ArticleFeed } from "~/features/article-feed";
import { getUser } from "~/server/auth";

export default async function ArticleFeedPage() {
  const user = await getUser();
  return <ArticleFeed userPublicKey={user?.publicKey} />;
}
