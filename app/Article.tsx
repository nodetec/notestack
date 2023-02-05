import Link from "next/link";
import { Event, nip19, Relay } from "nostr-tools";
import {
  DetailedHTMLProps,
  FC,
  LiHTMLAttributes,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { BsFillTagFill } from "react-icons/bs";
import { RelayContext } from "./context/relay-provider";
import { ProfilesContext } from "./context/profiles-provider";
import DeleteBlog from "./DeleteBlog";
import { DUMMY_PROFILE_API } from "./lib/constants";
import { NostrService } from "./lib/nostr";
import { markdownImageContent, shortenHash } from "./lib/utils";
import { getTagValues } from "./lib/utils";

// TODO: profile

interface NoteProps
  extends DetailedHTMLProps<LiHTMLAttributes<HTMLLIElement>, HTMLLIElement> {
  event: Event;
  profile?: boolean;
  dateOnly?: boolean;
}

const Article: FC<NoteProps> = ({
  event,
  profile = false,
  dateOnly = false,
  ...props
}) => {
  const { tags, created_at: createdAt, id: noteId } = event;
  let { content } = event;

  function getTValues(tags: string[][]) {
    return tags
      .filter((subTags) => subTags[0] === "t")
      .map((subTags) => subTags[1])
      .filter((t) => t.length <= 20);
  }

  const tValues = getTValues(event.tags);

  const npub = nip19.npubEncode(event.pubkey);

  const title = getTagValues("subject", tags);
  // const actualTags = getTagValues("tags", tags);
  const thumbnail = markdownImageContent(content);

  const markdownImagePattern = /!\[.*\]\(.*\)/g;
  content = content.replace(markdownImagePattern, "");

  // @ts-ignore
  // const { connectedRelays, activeRelays, isReady } = useContext(RelayContext);
  // @ts-ignore
  // const { profiles, setProfiles } = useContext(ProfilesContext);

  // const [user, setUser] = useState();

  // useEffect(() => {
  //   // setExploreEvents([]);
  //   // setFollowingEvents([]);
  //   let count = 0;
  //   const eventObj: { [fieldName: string]: any } = {};
  //   connectedRelays.forEach((relay: Relay) => {
  //     let sub = relay.sub([
  //       {
  //         kinds: [0],
  //         authors: [event.pubkey],
  //       },
  //     ]);

  //     let relayUrl = relay.url.replace("wss://", "");
  //     eventObj[relayUrl] = [];

  //     sub.on("event", (event: Event) => {
  //       // console.log("getting event", event, "from relay:", relay.url);
  //       // @ts-ignore
  //       event.relayUrl = relayUrl;
  //       eventObj[relayUrl].push(event);
  //     });

  //     sub.on("eose", () => {
  //       count++;
  //       console.log("EOSE initial latest events from", relay.url);
  //       if (count === connectedRelays.length) {
  //         const filteredEvents = NostrService.filterUserEvents(eventObj);
  //         console.log("FILTERED____EVENTS", filteredEvents);
  //         if (filteredEvents.length > 0) {
  //           setUser(filteredEvents[0]);
  //         }
  //         console.log("eventObj", eventObj);
  //       }
  //       sub.unsub();
  //     });
  //   });
  // }, [isReady]);

  return (
    <article
      className="py-8 border-b border-b-light-gray overflow-x-hidden"
      {...props}
    >
      <div className="flex flex-row justify-between">
        <div>
          <div className="flex items-center gap-2 pb-4">
            {profile ? (
              <div className="flex items-center gap-2">
                <Link className="group" href={`u/${npub}`}>
                  <Item className="text-gray-hover">
                    <img
                      className="rounded-full w-6 h-6 object-cover"
                      // src={data?.picture || DUMMY_PROFILE_API(npub)}
                      // alt={data?.name}
                      src={DUMMY_PROFILE_API(npub)}
                      alt={shortenHash(npub)}
                    />
                    <span className="group-hover:underline">
                      {/* {data?.name || shortenHash(npub)!} */}
                      {shortenHash(npub)!}
                    </span>
                  </Item>
                </Link>
                <span>·</span>
              </div>
            ) : null}
            <DatePosted timestamp={createdAt} />
            <span>·</span>
            {/* @ts-ignore */}
            <span className="text-gray">{event.relayUrl}</span>
          </div>
        </div>
        <DeleteBlog event={event} />
      </div>

      <Link href={`/${nip19.noteEncode(noteId!)}`}>
        <div className="flex gap-12">
          <div className="flex-1">
            {title ? (
              <h2 className="text-2xl font-bold text-black twolines mb-2">
                {title}
              </h2>
            ) : null}
            <p className="text-gray text-sm leading-6">
              {content.length > 250 ? content.slice(0, 250) + "..." : content}
            </p>
          </div>

          {thumbnail ? (
            <div>
              <img
                className="w-32 h-32 object-contain"
                src={thumbnail.groups?.filename}
                alt={thumbnail.groups?.title}
              />
            </div>
          ) : null}
        </div>
      </Link>
      <ul className="flex items-center gap-2 text-sm flex-wrap mt-4">
        {tValues.map((topic) => (
          <li key={topic}>
            <Link
              className="rounded-full inline-block py-2 px-3 bg-opacity-50 hover:bg-opacity-80 bg-light-gray text-gray-hover"
              href={`/tag/${topic.replace(" ", "-")}`}
            >
              {topic}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
};

const Item = ({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) => <div className={`flex gap-2 items-center ${className}`}>{children}</div>;

export const DatePosted = ({ timestamp }: { timestamp: number }) => {
  const timeStampToDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Item className="text-gray text-sm">{timeStampToDate(timestamp)}</Item>
  );
};

export const NoteTags = ({
  tags,
  showIcon = false,
}: {
  tags: string[];
  showIcon?: boolean;
}) => (
  <Item>
    {showIcon ? (
      <span>
        <BsFillTagFill className="w-4 h-4 text-current" />
      </span>
    ) : null}
    <ul className="flex items-center gap-2 list-none pl-0 my-0">
      {tags.map((tag: string) => (
        <li className=" py-1 px-2 rounded-md" key={tag}>
          {tag}
        </li>
      ))}
    </ul>
  </Item>
);

export default Article;
