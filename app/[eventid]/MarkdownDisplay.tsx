import { getTagValues, shortenHash } from "../lib/utils";
import { Event, nip19 } from "nostr-tools";
import {
  AnchorHTMLAttributes,
  DetailedHTMLProps,
  Dispatch,
  FC,
  Fragment,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import Button from "../Button";
import { usePathname } from "next/navigation";
import { AiFillLinkedin, AiOutlineTwitter } from "react-icons/ai";
import { DUMMY_PROFILE_API, HOST } from "../lib/constants";
import Link from "next/link";
import { DatePosted } from "../Article";
import AuthorTooltip from "../AuthorTooltip";
import { IconType } from "react-icons";
import { NotifyContext } from "../context/notify-provider";
import useCopy from "../hooks/useCopy";
import { ImLink } from "react-icons/im";
import Tooltip from "../Tooltip";
import { FaFacebook } from "react-icons/fa";
import { BsArrowBarRight } from "react-icons/bs";
import { RelayContext } from "../context/relay-provider";
import { ProfilesContext } from "../context/profiles-provider";

// TODO: profile

const SOCLIAL_LINKS = [
  {
    label: "Twitter",
    Icon: AiOutlineTwitter,
    url: (title: string, link: string) =>
      `https://twitter.com/intent/tweet?text=${title}&url=${link}`,
  },
  {
    label: "Facebook",
    Icon: FaFacebook,
    url: (title: string, link: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${link}&title=${title}`,
  },
  {
    label: "LinkedIn",
    Icon: AiFillLinkedin,
    url: (title: string, link: string) =>
      `https://www.linkedin.com/shareArticle?url=${link}&title=${title}&mini=true`,
  },
];

interface MarkdownDisplayProps {
  event: Event;
  zenMode: boolean;
  setZenMode: Dispatch<SetStateAction<boolean>>;
}

const MarkdownDisplay = ({
  event,
  zenMode,
  setZenMode,
}: MarkdownDisplayProps) => {
  const tags = event.tags;
  const pathname = usePathname();
  const title = getTagValues("title", tags);
  const heroImage = getTagValues("image", tags);
  const publishedAt = parseInt(getTagValues("published_at", tags));
  const content = event.content;
  const npub = nip19.npubEncode(event.pubkey);
  const { copyToClipboard, isCopied, isError } = useCopy();
  const { setNotifyMessage } = useContext(NotifyContext);
  const [name, setName] = useState<string>();
  const [picture, setPicture] = useState<string>(DUMMY_PROFILE_API(npub));

  // @ts-ignore
  const { relayUrl } = useContext(RelayContext);

  // @ts-ignore
  const { profiles, reload, addProfiles } = useContext(ProfilesContext);

  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  function setupMarkdown(content: string) {
    var md = require("markdown-it")();
    var result = md.render(content || "");
    return result;
  }

  // clean this up as well
  const getProfile = () => {
    let relayName = relayUrl.replace("wss://", "");
    const profileKey = `profile_${relayName}_${event.pubkey}`;
    const profile = profiles[profileKey];
    if (!profile) {
      addProfiles([profileKey]);
    }
    if (profile && profile.content) {
      const profileContent = JSON.parse(profile.content);
      setName(profileContent.name);
      if (!profileContent.picture || profileContent.picture === "") {
        setPicture(DUMMY_PROFILE_API(npub));
      } else {
        setPicture(profileContent.picture);
      }
    }
  };

  useEffect(() => {
    getProfile();
  }, [relayUrl, reload]);

  const markdown = setupMarkdown(content);

  useEffect(() => {
    if (isCopied) {
      setNotifyMessage("Link copied");
    }
    if (isError) {
      setNotifyMessage("Error copying link");
    }
  }, [isCopied, isError, setNotifyMessage]);

  return (
    <Fragment>
      <div className="mx-auto w-full text-accent flex items-center justify-between gap-2">
        <div className="flex justify-start w-full">
          <div className="flex flex-row items-center gap-4">
            {zenMode ? (
              <>
                <Link href={`u/${npub}`} onClick={scrollToTop}>
                  <img
                    className="rounded-full w-11 h-11 object-cover"
                    src={picture}
                    alt={""}
                  />
                </Link>
                <div className="flex flex-col gap-1">
                  <Link href={`u/${npub}`} onClick={scrollToTop}>
                    <span className="hover:underline text-sm">
                      {name || shortenHash(npub)}
                    </span>
                  </Link>
                  <DatePosted timestamp={publishedAt || event.created_at} />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1">
                <DatePosted timestamp={publishedAt || event.created_at} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {SOCLIAL_LINKS.map(({ label, Icon, url }, idx) => (
            <Tooltip
              key={idx}
              showOnHover
              color="black"
              size="sm"
              className="w-max"
              Component={
                <SocialLink
                  href={url(title, `${HOST}${pathname}`)}
                  Icon={Icon}
                />
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
                icon={<ImLink size={20} />}
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
            className="w-max"
            size="sm"
            Component={
              <Button
                color="transparent"
                variant="ghost"
                className="ml-auto"
                onClick={() => setZenMode((current) => !current)}
                icon={
                  <BsArrowBarRight
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
      </div>

      <div className="prose prose-lg mt-12">
        <h1 className="text-4xl font-extrabold">{title}</h1>
        <img
          // className="rounded-full w-24 h-24 object-cover mb-4"
          src={heroImage}
          alt={""}
        />
        <div
          className="rounded-md mx-auto bg-secondary w-full h-full"
          dangerouslySetInnerHTML={{ __html: markdown }}
        />
      </div>
    </Fragment>
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

export default MarkdownDisplay;
