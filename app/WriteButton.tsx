"use client";

import { SlNote } from "react-icons/sl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BlogContext } from "./context/blog-provider";
import { useContext, useEffect, useState } from "react";
import { RelayContext } from "./context/relay-provider";
import { useRouter } from "next/navigation";
import { NostrService } from "./lib/nostr";
import { KeysContext } from "./context/keys-provider.jsx";
import { nip19 } from "nostr-tools";
import Button from "./Button";
import Popup from "./Popup";
import CreatableSelect from "react-select/creatable";
import { FeedContext } from "./context/feed-provider";
import PopupInput from "./PopupInput";

const WriteButton = () => {
  // @ts-ignore
  const { blog, setBlog } = useContext(BlogContext);
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [image, setImage] = useState("");
  const [tagsList, setTagsList] = useState<{ label: string; value: string }[]>(
    []
  );

  // @ts-ignore
  const { keys } = useContext(KeysContext);
  const publicKey = keys?.publicKey;
  // @ts-ignore
  const { activeRelay } = useContext(RelayContext);

  // @ts-ignore
  const { feed, setFeed } = useContext(FeedContext);

  // function getTValues(tags: string[][]) {
  //   return tags
  //     .filter((subTags) => subTags[0] === "t")
  //     .map((subTags) => subTags[1])
  //     .filter((t) => t.length <= 20);
  // }


  useEffect(() => {
    let mounted = true;

    if (mounted) {
      setSummary(blog.summary);
      setImage(blog.image);
    }
  }, [blog]);


  const setNoOptionsMessage = () => {
    return "No Options";
  };

  const handleSetTagsList = (list: any) => {
    if (list.length > 5) {
      return;
    }
    setTagsList(list);
  };

  const validateTags = (e: any) => {
    if (!e.key.match(/^[0-9a-zA-Z]+$/)) {
      e.preventDefault();
      return;
    }
  };

  const handlePublish = async () => {
    setIsOpen(true);
  };

  const submitPublish = async () => {
    const { title, content, indentifier } = blog;

    const tags = [
      ["client", "blogstack.io"],
      ["title", title],
    ];

    if (image && image !== "") tags.push(["image", image]);
    if (summary && summary !== "") tags.push(["summary", summary]);

    for (let tagValue of tagsList) {
      tags.push(["t", tagValue.value]);
    }

    if (blog.identifier && blog.identifier !== "") {
      tags.push(["d", blog.identifier]);
    } else {
      tags.push(["d", NostrService.randomId()]);
    }

    if (blog.publishedAt && blog.publishedAt > 0) {
      tags.push(["published_at", blog.publishedAt.toString()]);
    } else {
      tags.push(["published_at", Math.floor(Date.now() / 1000).toString()]);
    }

    let event = NostrService.createEvent(30023, publicKey, content, tags);

    try {
      event = await NostrService.addEventData(event);
    } catch (err: any) {
      return;
    }

    let eventId: any = null;
    eventId = event?.id;

    console.log("EVENT TO PUBLISH!!!:", event);

    if (!activeRelay) {
      // console.log("relay not active!");
      return;
      // TODO: handle this
    }
    let pub = activeRelay.publish(event);
    pub.on("ok", () => {
      console.log(`PUBLISH EVENT WAS ACCEPTED by ${activeRelay.url}`);
    });
    pub.on("seen", () => {
      console.log(`PUBLISH EVENT WAS SEEN ON ${activeRelay.url}`);
      setBlog({
        title: null,
        summary: null,
        content: null,
        image: null,
        identifier: null,
        publishedAt: null,
      });
      let relayUrl = activeRelay.url.replace("wss://", "");
      let feedKey = `latest_${relayUrl}`;
      feed[feedKey] = null;
      setFeed(feed);
      router.push("/u/" + nip19.npubEncode(publicKey));
    });
    pub.on("failed", (reason: string) => {
      console.log(
        `OUR PUBLISH EVENT HAS FAILED WITH REASON: ${activeRelay.url}: ${reason}`
      );
    });
  };

  return (
    <>
      {pathname === "/write" ? (
        <>
          <Button size="sm" color="green" onClick={handlePublish}>
            Publish
          </Button>
          <Popup title="" isOpen={isOpen} setIsOpen={setIsOpen}>
            <PopupInput
              value={summary}
              onChange={(evn) => setSummary(evn.target.value)}
              label="Summary"
            />
            <PopupInput
              value={image}
              onChange={(e) => setImage(e.target.value)}
              label="Hero Image"
            />
            <small>Add topics (up to 5)</small>
            <CreatableSelect
              isMulti
              noOptionsMessage={setNoOptionsMessage}
              value={tagsList}
              isOptionDisabled={() => tagsList.length >= 5}
              options={[]}
              onChange={handleSetTagsList}
              onKeyDown={validateTags}
            />
            <Button size="sm" color="green" onClick={submitPublish}>
              Publish Now
            </Button>
          </Popup>
        </>
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
