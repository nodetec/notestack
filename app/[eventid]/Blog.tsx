import { Event, nip19, Relay } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import Aside from "../Aside";
import Profile from "../components/profile/Profile";
import Content from "../Content";
import Main from "../Main";
import RecommendedEvents from "../RecommendedEvents";
import MarkdownDisplay from "./MarkdownDisplay";
import { NostrService } from "@/app/lib/nostr";
import Topics from "../Topics";
import { RelayContext } from "../context/relay-provider";

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
  const { connectedRelays } = useContext(RelayContext);
  const profilePubkey = nip19.decode(npub).data.toString();
  const [zenMode, setZenMode] = useState(false);
  const filter = {
    kinds: [2222],
    authors: [profilePubkey],
    limit: 50,
    until: undefined,
  };

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

  useEffect(() => {
    const profileEventsString = sessionStorage.getItem(
      profilePubkey + "_events"
    );
    if (!profileEventsString && events.length === 0) {
      const eventsSeen: { [k: string]: boolean } = {};
      let eventArray: Event[] = [];
      connectedRelays.forEach((relay: Relay) => {
        let sub = relay.sub([filter]);
        sub.on("event", (event: Event) => {
          if (!eventsSeen[event.id!]) {
            eventArray.push(event);
          }
          eventsSeen[event.id!] = true;
        });
        sub.on("eose", () => {
          console.log("EOSE initial latest profile events from", relay.url);
          const filteredEvents = NostrService.filterBlogEvents(eventArray);
          if (filteredEvents.length > 0) {
            setEvents(filteredEvents);
            const eventsString = JSON.stringify(filteredEvents);
            sessionStorage.setItem(profilePubkey + "_events", eventsString);
          }
          sub.unsub();
        });
      });
    }
  }, [connectedRelays]);

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
          <RecommendedEvents
            title="More from the author"
            EVENTS={events.map((event: Event) => event.id!) || []}
            showProfile
            showThumbnail
          />
          <Topics title="Related topics" TOPICS={tagsTags} />
        </Aside>
      )}
    </Main>
  );
}
