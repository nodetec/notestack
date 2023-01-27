import { getTagValues } from "../lib/utils";
import { Event } from "nostr-tools";
import { Fragment, useState } from "react";
import Button from "../Button";
import { IoChevronBack } from "react-icons/io5";
import { usePathname, useRouter } from "next/navigation";
import { AiOutlineShareAlt } from "react-icons/ai";
import SharePopup from "../SharePopup";
import { HOST } from "../lib/constants";

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

  function setupMarkdown(content: string) {
    var md = require("markdown-it")();
    var result = md.render(content);
    return result;
  }

  const markdown = setupMarkdown(content);

  return (
    <Fragment>
      <div className="mx-auto w-full mb-4 prose prose-xl text-accent flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            icon={<IoChevronBack />}
            title="Go back"
            onClick={() => router.back()}
          />
          <h1 className="my-0 text-light text-3xl">{title}</h1>
        </div>
        <Button
          variant="ghost"
          title="Share note"
          icon={<AiOutlineShareAlt />}
          onClick={() => setIsSharePopupOpen(true)}
        />
      </div>
      <div
        className="rounded-md p-4 md:p-8 mx-auto bg-secondary w-full prose prose-xl h-full"
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
