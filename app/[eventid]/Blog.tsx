import { Event, nip19, Relay } from "nostr-tools";
import { useEffect, useState } from "react";
import Aside from "../Aside";
import Profile from "../components/profile/Profile";
import Content from "../Content";
import Main from "../Main";
import RecommendedEvents from "../RecommendedEvents";
import MarkdownDisplay from "./MarkdownDisplay";
import Topics from "../Topics";

interface NoteProps {
  event: Event;
}

export default function Note({ event }: NoteProps) {
  const [profileInfo, setProfileInfo] = useState({
    name: "",
    about: "",
    picture: "",
  });
  // TODO: get event from context if available instead of using hook everytime
  const tags = event.tags;
  const tagsTags = tags
    .filter((tag: string[]) => tag[0] === "t")
    .map((tag: string[]) => tag[1]);
  const npub = nip19.npubEncode(event.pubkey);
  const [events, setEvents] = useState<Event[]>([]);
  // @ts-ignore
  const profilePubkey = nip19.decode(npub).data.toString();
  const [zenMode, setZenMode] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (events.length === 0) {
      const profileEventsString = sessionStorage.getItem(
        profilePubkey + "_events"
      );
      if (profileEventsString) {
        const cachedEvents = JSON.parse(profileEventsString);
        setEvents(cachedEvents);
        console.log("using cached events for user:", npub);
      }
    }
  }, []);

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
          <Profile npub={npub} setProfileInfo={setProfileInfo} />
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
