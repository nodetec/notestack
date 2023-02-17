import { FC, useContext, useEffect, useState } from "react";
import Button from "./Button";
import { NotifyContext } from "./context/notify-provider";
import useCopy from "./hooks/useCopy";
import Tooltip from "./Tooltip";
import { BiDotsHorizontalRounded } from "react-icons/bi";
import { BlogContext } from "./context/blog-provider";
import { nip19, Event } from "nostr-tools";
import { KeysContext } from "./context/keys-provider";
import { useRouter } from "next/navigation";
import { getTagValues } from "./lib/utils";

interface AuthorTooltipProps {
  npub: string;
  event?: Event;
}

const AuthorTooltip: FC<AuthorTooltipProps> = ({ npub, event }) => {
  // @ts-ignore
  const { blog, setBlog } = useContext(BlogContext);
  const profilePubkey = nip19.decode(npub).data.toString();
  // @ts-ignore
  const { keys } = useContext(KeysContext);
  const [showTooltip, setShowTooltip] = useState(false);
  const { copyToClipboard, isCopied, isError } = useCopy();
  const { setNotifyMessage } = useContext(NotifyContext);
  const router = useRouter();

  useEffect(() => {
    if (isCopied) {
      setNotifyMessage("Link copied");
    }
    if (isError) {
      setNotifyMessage("Error copying link");
    }
  }, [isCopied, isError, setNotifyMessage]);

  useEffect(() => {
    // console.log("event", event);
  }, [showTooltip, event]);

  const handleEdit = (event: Event) => {
    const tags = event.tags;
    const title = getTagValues("title", tags);
    const image = getTagValues("image", tags);
    const identifier = getTagValues("d", tags);
    const summary = getTagValues("summary", tags);
    setBlog({
      title: title,
      summary: summary,
      content: event.content,
      image: image,
      identifier: identifier,
      createdAt: event.created_at,
    });
    router.push("/write");
  };

  return (
    <Tooltip
      direction="bottom"
      show={showTooltip}
      toggle={() => setShowTooltip((current) => !current)}
      Component={
        <Button
          color="transparent"
          variant="ghost"
          size="sm"
          icon={<BiDotsHorizontalRounded size="24" />}
        />
      }
    >
      <div className="flex flex-col gap-3 w-max">
        {keys.publicKey === profilePubkey && event ? (
          <>
            <Button
              variant="ghost"
              color="transparent"
              size="xs"
              onClick={() => {
                handleEdit(event);
                setShowTooltip(false);
              }}
            >
              Edit
            </Button>
            {/* <Button */}
            {/*   color="transparent" */}
            {/*   variant="ghost" */}
            {/*   size="xs" */}
            {/*   onClick={() => { */}
            {/*     setNotifyMessage("click the ⚡ button under the user card"); */}
            {/*     // handleDelete(false); */}
            {/*   }} */}
            {/* > */}
            {/*   Delete */}
            {/* </Button> */}
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              color="transparent"
              size="xs"
              onClick={() => {
                copyToClipboard(npub);
                setShowTooltip(false);
              }}
            >
              Copy link to profile
            </Button>
            <Button
              color="transparent"
              variant="ghost"
              size="xs"
              onClick={() => {
                setNotifyMessage("click the ⚡ button under the user card");
                setShowTooltip(false);
              }}
            >
              Support this author
            </Button>
          </>
        )}
      </div>
    </Tooltip>
  );
};

export default AuthorTooltip;
