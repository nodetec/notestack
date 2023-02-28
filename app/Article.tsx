import Link from "next/link";
import { Event, nip19 } from "nostr-tools";
import {
  DetailedHTMLProps,
  FC,
  Fragment,
  LiHTMLAttributes,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { RelayContext } from "./context/relay-provider";
import { ProfilesContext } from "./context/profiles-provider";
import DeleteBlog from "./DeleteBlog";
import { DUMMY_PROFILE_API } from "./lib/constants";
import {
  calculateEstimatedReadingTime,
  markdownImageContent,
  shortenHash,
  getRelativeTime,
} from "./lib/utils";
import { getTagValues } from "./lib/utils";
import { useRouter } from "next/navigation";
import { CachedEventContext } from "./context/cached-event-provider";
import { AddressPointer } from "nostr-tools/nip19";
import Tooltip from "./Tooltip";
import { Tag } from "./icons";
// import AuthorTooltip from "./AuthorTooltip";

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
  const { tags, created_at: createdAt /* , id: noteId  */ } = event;
  let { content } = event;

  function getTValues(tags: string[][]) {
    return tags
      .filter((subTags) => subTags[0] === "t")
      .map((subTags) => subTags[1])
      .filter((t) => t.length <= 20);
  }

  const router = useRouter();

  const tValues = getTValues(event.tags);

  const npub = nip19.npubEncode(event.pubkey);

  const title = getTagValues("title", tags);
  const image = getTagValues("image", tags);
  const summary = getTagValues("summary", tags);
  const publishedAt = parseInt(getTagValues("published_at", tags));
  // const actualTags = getTagValues("tags", tags);
  const thumbnail = markdownImageContent(content);

  const markdownImagePattern = /!\[.*\]\(.*\)/g;
  content = content.replace(markdownImagePattern, "");

  const { relayUrl, activeRelay } = useContext(RelayContext);
  // @ts-ignore
  const { profiles, reload } = useContext(ProfilesContext);

  const { setCachedEvent } = useContext(CachedEventContext);

  const [picture, setPicture] = useState(DUMMY_PROFILE_API(npub));
  const [name, setName] = useState();

  useEffect(() => {
    setName(getName(event));
    setPicture(getPicture(event));
  }, [activeRelay, reload]);

  const getPicture = (event: Event) => {
    if (!activeRelay) return DUMMY_PROFILE_API(npub);

    const relayUrl = activeRelay.url.replace("wss://", "");
    const profileKey = `profile_${relayUrl}_${event.pubkey}`;
    const profile = profiles[profileKey];

    if (profile && profile.content) {
      // TODO: check if this exists
      const profileContent = JSON.parse(profile.content);
      if (profileContent.picture === "") {
        return DUMMY_PROFILE_API(npub);
      }

      return profileContent.picture || DUMMY_PROFILE_API(npub);
    }

    return DUMMY_PROFILE_API(npub);
  };

  const getName = (event: Event) => {
    if (!activeRelay) return shortenHash(npub);

    const relayUrl = activeRelay.url.replace("wss://", "");
    const profileKey = `profile_${relayUrl}_${event.pubkey}`;
    const profile = profiles[profileKey];

    if (profile && profile.content) {
      const profileContent = JSON.parse(profile.content);
      return profileContent.name || shortenHash(npub);
    }

    return shortenHash(npub);
  };

  const routeCachedEvent = () => {
    setCachedEvent(event);

    const identifier = getTagValues("d", tags);

    // TODO: handle relays
    const addressPointer: AddressPointer = {
      identifier: identifier,
      pubkey: event.pubkey,
      kind: 30023,
      relays: [relayUrl],
    };

    // router.push("/" + nip19.noteEncode(event.id!));
    router.push("/" + nip19.naddrEncode(addressPointer));
  };

  return (
    <article className="py-8 border-b border-b-light-gray" {...props}>
      <div className="flex flex-row justify-between">
        <div>
          <div className="flex items-center gap-2 pb-4">
            {activeRelay && profile ? (
              <div className="flex items-center gap-2">
                <Link className="group" href={`u/${npub}`}>
                  {activeRelay && (
                    <Item className="text-gray-hover">
                      <img
                        className="rounded-full w-6 h-6 object-cover"
                        src={picture}
                        alt={""}
                      />
                      <span className="group-hover:underline text-xs md:text-sm">
                        {name}
                      </span>
                    </Item>
                  )}
                </Link>
                <span>·</span>
              </div>
            ) : null}
            <DatePosted timestamp={publishedAt || createdAt} />
            <div className="hidden md:flex md:flex-row md:gap-2 md:items-center">
              <span>·</span>
              <span className="text-gray text-xs md:text-sm">
                {/* @ts-ignore */}
                {event.relayUrl}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="cursor-pointer" onClick={routeCachedEvent}>
        <div className="flex gap-12">
          <div className="flex-1">
            {title ? (
              <h2 className="text-sm sm:text-2xl font-bold text-black twolines mb-2">
                {title}
              </h2>
            ) : null}
            <p className="text-gray text-sm leading-6 hidden sm:block">
              {summary
                ? summary.length > 250
                  ? summary.slice(0, 250) + "..."
                  : summary
                : content.length > 250
                ? content.slice(0, 250) + "..."
                : content}
            </p>
          </div>
          {image ? (
            <div>
              <img
                className="w-16 h-16 sm:w-32 sm:h-32 object-contain"
                src={image}
                alt={""}
              />
            </div>
          ) : thumbnail ? (
            <div>
              <img
                className="w-16 h-16 sm:w-32 sm:h-32 object-contain"
                src={image || thumbnail.groups?.filename}
                alt={thumbnail.groups?.title}
              />
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex flex-row gap-2 items-center mt-6 text-xs ">
        {tValues.length > 0 ? (
          <Fragment>
            <ul className="flex items-center gap-2 flex-wrap">
              <li>
                <Link
                  className="rounded-full inline-block py-1 px-2 bg-opacity-50 hover:bg-opacity-80 bg-light-gray text-gray-hover"
                  href={`/tag/${tValues[0].replace(" ", "-")}`}
                >
                  {tValues[0]}
                </Link>
              </li>
            </ul>
            <span>·</span>
          </Fragment>
        ) : null}
        <span className="text-gray-hover font-normal">
          {calculateEstimatedReadingTime(content)} min read
        </span>
        <DeleteBlog event={event} />
      </div>
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Item className="text-gray text-xs sm:text-sm">
      <Tooltip
        direction="bottom"
        size="sm"
        color="black"
        className="w-max"
        showOnHover
        Component={<span>{getRelativeTime(timestamp)}</span>}
      >
        {timeStampToDate(timestamp)}
      </Tooltip>
    </Item>
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
        <Tag className="w-4 h-4 text-current" />
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
