import { Event, nip19 } from "nostr-tools";
import Aside from "../Aside";
import Profile from "../components/profile/Profile";
import Content from "../Content";
import { getTagValues } from "../lib/utils";
import Main from "../Main";
import MarkdownDisplay from "./MarkdownDisplay";

interface NoteProps {
  event: Event;
}

export default function Note({ event }: NoteProps) {
  // TODO: get event from context if available instead of using hook everytime
  const tags = event.tags;
  const filetypeTag = getTagValues("filetype", tags);
  const npub = nip19.npubEncode(event.pubkey);

  let isMarkdown = false;

  if (filetypeTag === "markdown") {
    isMarkdown = true;
  }

  return (
    <Main>
      <Content>
        {event && (
          <div className="w-full self-center max-w-[70rem] my-16">
            <MarkdownDisplay event={event} />
          </div>
        )}
      </Content>
      <Aside>
        <Profile npub={npub} />
      </Aside>
    </Main>
  );
}
