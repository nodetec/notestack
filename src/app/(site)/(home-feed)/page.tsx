import { ArticleHomeFeed } from "~/features/article-feed/components/ArticleHomeFeed";
import { getUser } from "~/server/auth";

export default async function ArticleFeedPage() {
  const user = await getUser();
  return <ArticleHomeFeed userPublicKey={user?.publicKey} />;
}
