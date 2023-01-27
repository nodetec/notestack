import Link from "next/link";
import { useProfile } from "nostr-react";
import { Event, nip19 } from "nostr-tools";
import { DetailedHTMLProps, FC, LiHTMLAttributes, ReactNode } from "react";
import { BsFillTagFill } from "react-icons/bs";
import { DUMMY_PROFILE_API } from "./lib/constants";
import { shortenHash } from "./lib/utils";
import { getTagValues } from "./lib/utils";

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

  const { data } = useProfile({
    pubkey: event.pubkey,
  });

  const npub = nip19.npubEncode(event.pubkey);

  const title = getTagValues("subject", tags);
  // const actualTags = getTagValues("tags", tags);
  const markdownImageContent =
    /!\[[^\]]*\]\((?<filename>.*?)(?=\"|\))(?<title>\".*\")?\)/g.exec(content);

  const markdownImagePattern = /!\[.*\]\(.*\)/g;
  content = content.replace(markdownImagePattern, "");

  return (
    <article className="py-8 border-b border-b-light-gray overflow-x-hidden" {...props}>
      <div className="flex items-center gap-2">
        <Link href={`u/${npub}`}>
          <Item className="text-gray-hover">
            <img
              className="rounded-full w-6 h-6 object-cover"
              src={data?.picture || DUMMY_PROFILE_API(npub)}
              alt={data?.name}
            />
            <span>{data?.name || shortenHash(npub)!}</span>
          </Item>
        </Link>
        <DatePosted timestamp={createdAt} />
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

          {markdownImageContent ? (
            <div>
              <img
                className="w-32 h-32 object-cover"
                src={markdownImageContent.groups?.filename}
                alt={markdownImageContent.groups?.title}
              />
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
};

const Item = ({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <div className={`flex gap-2 items-center pb-4 ${className}`}>{children}</div>
);

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
    <Item className="text-gray">
      <span>·</span>
      <span className="text-sm">{timeStampToDate(timestamp)}</span>
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
