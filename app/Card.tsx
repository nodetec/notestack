import Link from "next/link";
import { useProfile } from "nostr-react";
import { Event, nip19 } from "nostr-tools";
import { DetailedHTMLProps, FC, LiHTMLAttributes, ReactNode } from "react";
import { BsFillTagFill } from "react-icons/bs";
import { FaCalendarAlt } from "react-icons/fa";
import { shortenHash } from "./lib/utils";
import { getTagValues } from "./lib/utils";

interface NoteProps
  extends DetailedHTMLProps<LiHTMLAttributes<HTMLLIElement>, HTMLLIElement> {
  event: Event;
  profile?: boolean;
  dateOnly?: boolean;
}

const Card: FC<NoteProps> = ({
  event,
  profile = false,
  dateOnly = false,
  ...props
}) => {
  const { tags, content, created_at: createdAt, id: noteId } = event;

  const { data } = useProfile({
    pubkey: event.pubkey,
  });

  const npub = nip19.npubEncode(event.pubkey);

  const title = getTagValues("subject", tags);
  // const actualTags = getTagValues("tags", tags);

  function setupMarkdown(content: string) {
    var md = require("markdown-it")();
    var result = md.render(content);
    return result;
  }

  const MAX_LENGTH = 300;

  const markdown =
    content.length > MAX_LENGTH
      ? content.slice(0, MAX_LENGTH).concat("...read more")
      : setupMarkdown(content.slice(0, MAX_LENGTH));

  return (
    <li
      className="border-b border-gray-300 transition-transform bg-secondary text-left"
      {...props}
    >
      <Link href={`/${nip19.noteEncode(noteId!)}`} className="p-5 block">
        <div className="flex flex-col gap-3 w-full">
          {title ? (
            <h3 className="text-2xl font-semibold  twolines">
              {title}
            </h3>
          ) : null}
          <div className="flex gap-5 opacity-70 flex-col md:flex-row flex-wrap">
            {profile ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div>
                    <span className="">
                      {data?.name || shortenHash(npub)!}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
            <DatePosted dateOnly={dateOnly} timestamp={createdAt} />
          </div>
          {/* <div> */}
          {/*   {actualTags.length ? ( */}
          {/*     <NoteTags showIcon tags={actualTags.split(",")} /> */}
          {/*   ) : null} */}
          {/* </div> */}
          <div className="flex flex-col sm:flex-row gap-5 w-full  max-h-[50vh] overflow-hidden rounded-md">
            <div className="w-full max-w-full p-4 prose prose-sm prose-invert prose-img:h-[20vmin] prose-img:w-auto prose-img:object-cover prose-img:mx-auto">
              <div dangerouslySetInnerHTML={{ __html: markdown }} />
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
};

const InfoContainer = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center gap-2">{children}</div>
);

export const DatePosted = ({
  timestamp,
  dateOnly,
}: {
  timestamp: number;
  dateOnly?: boolean;
}) => {
  const timeStampToDate = (timestamp: number) => {
    let date = new Date(timestamp * 1000);
    if (dateOnly) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    }
  };

  return (
    <InfoContainer>
      <span>
        <FaCalendarAlt className="w-4 h-4 text-current" />
      </span>
      <span>{timeStampToDate(timestamp)}</span>
    </InfoContainer>
  );
};

export const NoteTags = ({
  tags,
  showIcon = false,
}: {
  tags: string[];
  showIcon?: boolean;
}) => (
  <InfoContainer>
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
  </InfoContainer>
);

export default Card;
