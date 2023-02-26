import { getTagValues } from "../lib/utils";
import { Event, nip19 } from "nostr-tools";
import {
  AnchorHTMLAttributes,
  DetailedHTMLProps,
  Dispatch,
  FC,
  SetStateAction,
  useContext,
  useEffect,
} from "react";
import Button from "../Button";
import { usePathname } from "next/navigation";
import { HOST } from "../lib/constants";
import AuthorTooltip from "../AuthorTooltip";
import { NotifyContext } from "../context/notify-provider";
import useCopy from "../hooks/useCopy";
import Tooltip from "../Tooltip";
import {
  ArrowBarRight,
  Facebook,
  IconType,
  Link,
  Linkedin,
  Twitter,
} from "../icons";

const SOCLIAL_LINKS = [
  {
    label: "Twitter",
    Icon: Twitter,
    url: (title: string, link: string) =>
      `https://twitter.com/intent/tweet?text=${title}&url=${link}`,
  },
  {
    label: "Facebook",
    Icon: Facebook,
    url: (title: string, link: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${link}&title=${title}`,
  },
  {
    label: "LinkedIn",
    Icon: Linkedin,
    url: (title: string, link: string) =>
      `https://www.linkedin.com/shareArticle?url=${link}&title=${title}&mini=true`,
  },
];

interface BlogActionsProps {
  event: Event;
  zenMode: boolean;
  setZenMode: Dispatch<SetStateAction<boolean>>;
}

const BlogActions = ({ event, zenMode, setZenMode }: BlogActionsProps) => {
  const tags = event.tags;
  const pathname = usePathname();
  const title = getTagValues("title", tags);
  const npub = nip19.npubEncode(event.pubkey);
  const { copyToClipboard, isCopied, isError } = useCopy();
  const { setNotifyMessage } = useContext(NotifyContext);

  useEffect(() => {
    if (isCopied) {
      setNotifyMessage("Link copied");
    }
    if (isError) {
      setNotifyMessage("Error copying link");
    }
  }, [isCopied, isError, setNotifyMessage]);

  return (
    <div className="flex items-center gap-3">
      {SOCLIAL_LINKS.map(({ label, Icon, url }, idx) => (
        <Tooltip
          key={idx}
          showOnHover
          color="black"
          size="sm"
          className="w-max"
          Component={
            <SocialLink href={url(title, `${HOST}${pathname}`)} Icon={Icon} />
          }
        >
          Share to {label}
        </Tooltip>
      ))}
      <Tooltip
        showOnHover
        color="black"
        className="w-max"
        size="sm"
        Component={
          <Button
            variant="ghost"
            title="Copy Link"
            size="sm"
            icon={<Link size={20} />}
            className="text-medium-gray hover:text-gray-hover text-xs"
            onClick={() => copyToClipboard(`${HOST}${pathname}`)}
          />
        }
      >
        Copy link
      </Tooltip>
      <AuthorTooltip npub={npub} event={event} />
      <Tooltip
        showOnHover
        color="black"
        className="w-max hidden md:flex"
        size="sm"
        Component={
          <Button
            color="transparent"
            variant="ghost"
            className="ml-auto hidden md:flex"
            onClick={() => setZenMode((current) => !current)}
            icon={
              <ArrowBarRight
                size={20}
                className={zenMode ? "rotate-180" : ""}
              />
            }
          />
        }
      >
        {zenMode ? "Open Sidebar" : "Close Sidebar"}
      </Tooltip>
    </div>
  );
};

interface SocialLinkProps
  extends DetailedHTMLProps<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  > {
  Icon: IconType;
}

const SocialLink: FC<SocialLinkProps> = ({ Icon, ...props }) => {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="text-medium-gray hover:text-gray-hover"
      {...props}
    >
      <Icon size={20} />
    </a>
  );
};

export default BlogActions;
