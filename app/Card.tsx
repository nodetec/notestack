import Link from "next/link";
import { useProfile } from "nostr-react";
import { Event, nip19 } from "nostr-tools";
import { DetailedHTMLProps, FC, LiHTMLAttributes, ReactNode } from "react";
import { BsFillTagFill } from "react-icons/bs";
import { FaCalendarAlt } from "react-icons/fa";
import { DUMMY_PROFILE_API } from "./lib/constants";
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
  const { tags, created_at: createdAt, id: noteId } = event;
  let { content } = event;

  const { data } = useProfile({
    pubkey: event.pubkey,
  });

  const npub = nip19.npubEncode(event.pubkey);

  const title = getTagValues("subject", tags);
  // const actualTags = getTagValues("tags", tags);
  const markdownImagePattern = /!\[.*\]\(.*\)/g;
  content = content.replace(markdownImagePattern, "");

  function setupMarkdown(content: string) {
    var md = require("markdown-it")();
    var result = md.render(content);
    return result;
  }

  const MAX_LENGTH = 200;

  let markdown =
    content.length > MAX_LENGTH
      ? setupMarkdown(content.slice(0, MAX_LENGTH).concat("...read more"))
      : setupMarkdown(content.slice(0, MAX_LENGTH));
  const markdownImageContent =
  /!\[[^\]]*\]\((?<filename>.*?)(?=\"|\))(?<title>\".*\")?\)/g.exec(content);

  return (
    <li
      className="border-b border-gray-300 transition-transform bg-secondary text-left"
      {...props}
    >
      <Link href={`/${nip19.noteEncode(noteId!)}`} className="p-5 block md:min-w-[25rem] lg:min-w-[50rem]">
        <div className="flex flex-col gap-3 w-full">
          {title ? (
            <h3 className="text-2xl font-semibold  twolines">{title}</h3>
          ) : null}
          <div className="flex gap-5 opacity-70 flex-col md:flex-row flex-wrap">
            {profile ? (
              <div className="flex flex-col gap-2">
                <span className="flex items-center gap-2">
                  <img
                    className="rounded-full w-6 h-6 object-cover"
                    src={data?.picture || DUMMY_PROFILE_API(npub)}
                    alt={data?.name}
                  />
                  <div>
                    <span className="">{data?.name || shortenHash(npub)!}</span>
                  </div>
                </span>
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
            {markdownImageContent?.groups?.filename ? (
              <img
              className="rounded-md self-center w-12 h-12 md:w-16 md:h-16 lg:w-32 lg:h-32 object-contain"
              src={markdownImageContent.groups.filename}
              title={markdownImageContent?.groups?.title}
            />
            ) : null}
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
