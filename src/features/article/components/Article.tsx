import { getEvent } from "~/server/nostr";
import { nip19 } from "nostr-tools";
import remarkHtml from "remark-html";
import remarkParse from "remark-parse";
import { unified } from "unified";

type Props = {
  naddr: string;
};

export async function Article({ naddr }: Props) {
  const decodeResult = nip19.decode(naddr);

  if (decodeResult.type !== "naddr") {
    return <div>404</div>;
  }

  const address = decodeResult.data;

  const filter = {
    kinds: [address.kind],
    limit: 1,
    "#d": [address.identifier],
  };

  const event = await getEvent(filter);

  if (!event) {
    return <div>404</div>;
  }

  const processedContent = unified()
    .use(remarkParse)
    .use(remarkHtml)
    .processSync(event.content)
    .toString();

  return (
    <article
      className="prose prose-zinc mx-auto dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}
