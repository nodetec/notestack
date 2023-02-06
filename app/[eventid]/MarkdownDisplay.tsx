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
  const title = getTagValues("subject", tags);
  const content = event.content;
  const npub = nip19.npubEncode(event.pubkey);
  const { copyToClipboard, isCopied, isError } = useCopy();
  const { setNotifyMessage } = useContext(NotifyContext);
  const [name, setName] = useState<string>();
  const [picture, setPicture] = useState<string>(DUMMY_PROFILE_API(npub));

  // @ts-ignore
  const { activeRelay, pendingActiveRelayUrl } = useContext(RelayContext);

  // @ts-ignore
  const { profiles, setProfiles } = useContext(ProfilesContext);

  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  function setupMarkdown(content: string) {
    var md = require("markdown-it")();
    var result = md.render(content);
    return result;
  }

  const markdown = setupMarkdown(content);

  useEffect(() => {
    if (isCopied) {
      setNotifyMessage("Link copied");
    }
    if (isError) {
      setNotifyMessage("Error copying link");
    }
  }, [isCopied, isError, setNotifyMessage]);

  // TODO: this is copy pasted a few places needs to be cleaned up
  useEffect(() => {
    if (!activeRelay) return;
    const profilePubkey = nip19.decode(npub).data.toString();
    let relayUrl = activeRelay.url.replace("wss://", "");
    const cachedProfile = profiles[`profile_${relayUrl}_${profilePubkey}`];
    if (cachedProfile) {
      const profileContent = JSON.parse(cachedProfile.content);
      setName(profileContent.name);
      setPicture(profileContent.picture);
    } else {
      setName("");
      setPicture(DUMMY_PROFILE_API(npub));
      let sub = activeRelay.sub([
        {
          kinds: [0],
          authors: [profilePubkey],
        },
      ]);
      let events: Event[] = [];
      sub.on("event", (event: Event) => {
        // @ts-ignore
        event.relayUrl = relayUrl;
        events.push(event);
      });
      sub.on("eose", () => {
        if (events.length !== 0) {
          let event = events[0];
          let profileKey = `profile_${relayUrl}_${event.pubkey}`;
          const contentObj = JSON.parse(event.content);
          setName(contentObj.name);
          setPicture(contentObj.picture);
          profiles[profileKey] = event.content;
          setProfiles(profiles);
        }
        sub.unsub();
      });
    }
  }, [activeRelay]);

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
                  <DatePosted timestamp={event.created_at} />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1">
                <DatePosted timestamp={event.created_at} />
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
          <AuthorTooltip npub={npub} />
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
