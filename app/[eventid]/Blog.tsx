import { Event } from "nostr-tools";
import { getTagValues } from "../lib/utils";
import MarkdownDisplay from "./MarkdownDisplay";

interface NoteProps {
  event: Event;
}

export default function Note({ event }: NoteProps) {
  // TODO: get event from context if available instead of using hook everytime
  const tags = event.tags;

  const filetypeTag = getTagValues("filetype", tags);

  let isMarkdown = false;

  if (filetypeTag === "markdown") {
    isMarkdown = true;
  }

  return (
    <>
      {event && (
        <div className="w-full self-center max-w-[70rem] my-16">
          <MarkdownDisplay event={event} />
        </div>
      )}
    </>
  );
}
