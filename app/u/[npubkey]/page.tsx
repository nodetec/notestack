"use client";
import Main from "@/app/Main";

export default function ProfilePage() {

  // const [name, setName] = useState<string>();
  // const [about, setAbout] = useState<string>("");

  // const getProfileEvents = async () => {
  //   setIsEventsLoading(true);
  //   resetProfile();
  //   let pubkeysSet = new Set<string>();

  //   setEvents([]);
  //   let relayName = relayUrl.replace("wss://", "");
  //   let feedKey = `profilefeed_${relayUrl}_${profilePubkey}`;

  //   if (feed[feedKey]) {
  //     setEvents(feed[feedKey]);
  //     setIsEventsLoading(false);
  //     return;
  //   }

  //   let events: Event[] = [];

  //   const onEvent = (event: any) => {
  //     // @ts-ignore
  //     event.relayUrl = relayName;
  //     events.push(event);
  //     pubkeysSet.add(event.pubkey);
  //   };

  //   const onEOSE = () => {
  //     // @ts-ignore
  //     const filteredEvents = NostrService.filterBlogEvents(events);
  //     let feedKey = `profilefeed_${relayUrl}_${profilePubkey}`;
  //     feed[feedKey] = filteredEvents;
  //     setFeed(feed);
  //     if (filteredEvents.length > 0) {
  //       // @ts-ignore
  //       setEvents(filteredEvents);
  //     } else {
  //       setEvents([]);
  //     }
  //     setIsEventsLoading(false);
  //     if (pubkeysSet.size > 0) {
  //       // setpubkeys([...Array.from(pubkeysSet), ...pubkeys]);
  //       addProfiles(Array.from(pubkeysSet));
  //     }
  //   };

  //   subscribe([relayUrl], filter, onEvent, onEOSE);
  // };

  // look up blogs
  // look up profile
  // useEffect(() => {
  //   getProfileEvents();
  // }, [relayUrl]);

  // useEffect(() => {
  //   getProfile();
  // }, [reload, relayUrl]);

  return (
    <Main>
      <div>hi</div>
    </Main>
  );
}
