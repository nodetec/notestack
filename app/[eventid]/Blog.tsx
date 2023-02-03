import { useNostr } from "nostr-react";
import { Event, nip19 } from "nostr-tools";
import { useEffect, useState } from "react";
import Aside from "../Aside";
import Profile from "../components/profile/Profile";
import Content from "../Content";
import { getTagValues } from "../lib/utils";
import Main from "../Main";
import RecommendedEvents from "../RecommendedEvents";
import MarkdownDisplay from "./MarkdownDisplay";
import { NostrService } from "@/app/lib/nostr";
import Topics from "../Topics";

interface NoteProps {
  event: Event;
}

export default function Note({ event }: NoteProps) {
  // TODO: get event from context if available instead of using hook everytime
  const tags = event.tags;
  const filetypeTag = getTagValues("filetype", tags);

  const npub = nip19.npubEncode(event.pubkey);
  const [events, setEvents] = useState<Event[]>([]);
  const { connectedRelays } = useNostr();
  const profilePubkey = nip19.decode(npub).data.toString();
  const filter = {
    kinds: [2222],
    authors: [profilePubkey],
    limit: 50,
    until: undefined,
  };
  console.log("event", events);

  let isMarkdown = false;

  if (filetypeTag === "markdown") {
    isMarkdown = true;
  }

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
      connectedRelays.forEach((relay) => {
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
        <RecommendedEvents
          title="More from the author"
          EVENTS={events.map((event: Event) => event.id!) || []}
          showProfile
          showThumbnail
        />
        <Topics title="Related topics" TOPICS={[]} />
      </Aside>
    </Main>
  );
}
