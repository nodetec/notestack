import { getTagValues, shortenHash } from "../lib/utils";
// @ts-ignore
import { NoComment } from "react-nocomment";
import { Event, nip19 } from "nostr-tools";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { DUMMY_PROFILE_API, HOST } from "../lib/constants";
import Link from "next/link";
import { DatePosted } from "../Article";
import { RelayContext } from "../context/relay-provider";
import { ProfilesContext } from "../context/profiles-provider";
import BlogActions from "./BlogActions";
import TopProfile from "./TopProfile";

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
  const title = getTagValues("title", tags);
  const heroImage = getTagValues("image", tags);
  const publishedAt = parseInt(getTagValues("published_at", tags));
  const content = event.content;
  const npub = nip19.npubEncode(event.pubkey);
  const [name, setName] = useState<string>();
  const [picture, setPicture] = useState<string>(DUMMY_PROFILE_API(npub));

  const { relayUrl } = useContext(RelayContext);

  // @ts-ignore
  const { profiles, reload, addProfiles } = useContext(ProfilesContext);

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

  return (
    <>
      <div className="mx-auto w-full text-accent flex items-start md:items-center justify-between gap-2">
        <div className="hidden md:flex justify-start w-full">
          <div className="hidden md:flex flex-row items-start md:items-center gap-4 w-full">
            {zenMode ? (
              <>
                <div className="flex flex-row justify-between w-full">
                  <TopProfile event={event} />
                  <BlogActions
                    event={event}
                    zenMode={zenMode}
                    setZenMode={setZenMode}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-row justify-between w-full">
                <DatePosted timestamp={publishedAt || event.created_at} />
                <BlogActions
                  event={event}
                  zenMode={zenMode}
                  setZenMode={setZenMode}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-6 flex-col md:hidden">
          <TopProfile event={event} />
          <BlogActions
            event={event}
            zenMode={zenMode}
            setZenMode={setZenMode}
          />
        </div>
      </div>

      <div className="prose prose-lg mt-6 md:mt-12">
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
      <div className="border border-zinc-200 my-4"/>

      <NoComment className="outline-none" relays={[relayUrl]} />
    </>
  );
};

export default MarkdownDisplay;
