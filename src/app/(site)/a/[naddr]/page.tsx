import { nip19, SimplePool } from "nostr-tools";
import remarkHtml from "remark-html";
import remarkParse from "remark-parse";
import { unified } from "unified";

export default async function page({ params }: { params: { naddr: string } }) {
  console.log(params.naddr);

  const decodeResult = nip19.decode(params.naddr);

  if (decodeResult.type !== "naddr") {
    return <div>404</div>;
  }

  const address = decodeResult.data;

  const relays = ["wss://relay.notestack.com", "wss://nos.lol"];

  const pool = new SimplePool();

  const events = await pool.querySync(address.relays ?? relays, {
    kinds: [address.kind],
    limit: 1,
    "#d": [address.identifier],
  });
  console.log("events", events);

  const event = events[0];

  if (!event) {
    return <div>404</div>;
  }

  const processedContent = unified()
    .use(remarkParse)
    .use(remarkHtml)
    .processSync(event.content)
    .toString();

  return (
    <main className="grow p-2 sm:rounded-lg sm:bg-secondary sm:p-10 sm:shadow-sm sm:ring-1 sm:ring-zinc-950/5 dark:sm:ring-white/10">
      <article
        className="prose prose-zinc dark:prose-invert mx-auto"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    </main>
  );
}
