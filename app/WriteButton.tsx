"use client";

import { SlNote } from "react-icons/sl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BlogContext } from "./context/blog-provider";
import { useContext } from "react";
import { useNostr } from "nostr-react";
import { useRouter } from "next/navigation";
import { NostrService } from "./lib/nostr";
import { KeysContext } from "./context/keys-provider.jsx";
import { nip19 } from "nostr-tools";
import Button from "./Button";

const WriteButton = () => {
  const pathname = usePathname();
  const router = useRouter();
  // @ts-ignore
  const { blog, setBlog } = useContext(BlogContext);
  // @ts-ignore
  const { keys } = useContext(KeysContext);
  const { publish } = useNostr();
  // const { connectedRelays } = useNostr();
  const publicKey = keys?.publicKey;

  const handlePublish = async () => {
    const { title, text } = blog;
    console.log("TITLE:", title);
    console.log("TEXT:", text);

    const tags = [
      ["client", "blogstack.io"],
      ["subject", title],
    ];

    let event = NostrService.createEvent(2222, publicKey, text, tags);

    try {
      event = await NostrService.addEventData(event);
    } catch (err: any) {
      return;
    }

    let eventId: any = null;
    eventId = event?.id;

    const pubs = publish(event);

    // @ts-ignore
    for await (const pub of pubs) {
      pub.on("ok", () => {
        console.log("OUR EVENT WAS ACCEPTED");
      });

      await pub.on("seen", async () => {
        console.log("OUR EVENT WAS SEEN");
        router.push("/u/" + nip19.npubEncode(publicKey));
      });

      pub.on("failed", (reason: any) => {
        console.log("OUR EVENT HAS FAILED WITH REASON:", reason);
      });
    }
  };

  return (
    <>
      {pathname === "/write" ? (
        <Button
          size="sm"
          color="green"
          onClick={handlePublish}
        >
          Publish
        </Button>
      ) : (
        <Link
          className="flex gap-2 text-gray hover:text-gray-hover"
          href="/write"
        >
          <SlNote size="20" />
          <span className="text-sm">Write</span>
        </Link>
      )}
    </>
  );
};

export default WriteButton;
