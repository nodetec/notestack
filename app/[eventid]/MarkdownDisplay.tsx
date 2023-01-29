import { getTagValues, shortenHash } from "../lib/utils";
import { Event, nip19 } from "nostr-tools";
import { Fragment, useState } from "react";
import Button from "../Button";
import { IoChevronBack } from "react-icons/io5";
import { usePathname, useRouter } from "next/navigation";
import { AiOutlineShareAlt } from "react-icons/ai";
import SharePopup from "../SharePopup";
import { DUMMY_PROFILE_API, HOST } from "../lib/constants";
import { useProfile } from "nostr-react";
import Link from "next/link";
import { DatePosted } from "../Article";

interface MarkdownDisplayProps {
  event: Event;
}

const MarkdownDisplay = ({ event }: MarkdownDisplayProps) => {
  const tags = event.tags;
  const pathname = usePathname();
  const title = getTagValues("subject", tags);
  const content = event.content;
  const router = useRouter();
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);
  const npub = nip19.npubEncode(event.pubkey);

  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  const { data } = useProfile({
    pubkey: event.pubkey,
  });

  function setupMarkdown(content: string) {
    var md = require("markdown-it")();
    var result = md.render(content);
    return result;
  }

  const markdown = setupMarkdown(content);

  return (
    <Fragment>
      <div className="mx-auto w-full mb-4 prose prose-xl text-accent flex items-center justify-between gap-2">
        <div className="flex items-center gap-4 w-full">
          <Button
            className="mb-auto"
            variant="ghost"
            icon={<IoChevronBack />}
            title="Go back"
            onClick={() => router.back()}
          />

          <div className="flex flex-col w-full">
            <h1 className="my-0 text-light text-3xl">{title}</h1>
            <div className="flex flex-row justify-between w-full">
              <div className="flex justify-start w-full">
                <div className="flex flex-row items-center gap-2">
                  <Link
                    className="group"
                    href={`u/${npub}`}
                    onClick={scrollToTop}
                  >
                    <img
                      className="rounded-full w-10 h-10 object-cover"
                      src={data?.picture || DUMMY_PROFILE_API(npub)}
                      alt={data?.name}
                    />
                  </Link>

                  <div className="flex flex-col">
                    <span className="group-hover:underline text-sm">
                      {data?.name || shortenHash(npub)!}
                    </span>

                    <DatePosted timestamp={event.created_at} />
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                title="Share note"
                icon={<AiOutlineShareAlt />}
                onClick={() => setIsSharePopupOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className="rounded-md mx-auto bg-secondary w-full prose prose-xl h-full"
        dangerouslySetInnerHTML={{ __html: markdown }}
      />
      <SharePopup
        link={`${HOST}${pathname}`}
        title="Share to"
        isOpen={isSharePopupOpen}
        setIsOpen={setIsSharePopupOpen}
      />
    </Fragment>
  );
};

export default MarkdownDisplay;
