import { Event, nip19 } from "nostr-tools";
import { useEffect, useState } from "react";
import Aside from "../Aside";
import Content from "../Content";
import Main from "../Main";
import RecommendedEvents from "../RecommendedEvents";
import MarkdownDisplay from "./MarkdownDisplay";
import Topics from "../Topics";
import UserCard from "../components/profile/UserCard";
import Following from "../components/profile/Following";

interface NoteProps {
  event: Event;
}

export default function Note({ event }: NoteProps) {
  // TODO: get event from context if available instead of using hook everytime
  const tags = event.tags;
  const tagsTags = tags
    .filter((tag: string[]) => tag[0] === "t")
    .map((tag: string[]) => tag[1]);
  const npub = nip19.npubEncode(event.pubkey);
  // @ts-ignore
  const [zenMode, setZenMode] = useState(false);

  return (
    <Main mode={zenMode ? "zen" : "normal"}>
      <Content>
        {event && (
          <div className="w-full self-center max-w-[70rem] my-16">
            <MarkdownDisplay
              zenMode={zenMode}
              setZenMode={setZenMode}
              event={event}
            />
          </div>
        )}
      </Content>
      {zenMode ? null : (
        <Aside>
          <UserCard npub={npub} />
          {/* <Following npub={npub} /> */}
          {/* <RecommendedEvents */}
          {/*   title="More from the author" */}
          {/*   EVENTS={events.map((event: Event) => event.id!) || []} */}
          {/*   showProfile */}
          {/*   showThumbnail */}
          {/* /> */}
          <Topics title="Related topics" TOPICS={tagsTags} />
        </Aside>
      )}
    </Main>
  );
}
