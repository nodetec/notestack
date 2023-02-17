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
import PublishPopup from "./PublishPopup";
import CreatableSelect from "react-select/creatable";
import { FeedContext } from "./context/feed-provider";
import PublishPopupInput from "./PublishPopupInput";
import PopupCheckbox from "./PopupCheckbox";
import Popup from "./Popup";

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
  const { allRelays, relayUrl, publish } = useContext(RelayContext);
  const [toggledRelays, setToggledRelays] = useState<string[]>([relayUrl]);
  const [publishFailed, setPublishFailed] = useState<string[]>([]);
  const [publishSuccess, setPublishSuccess] = useState<string[]>([]);
  const [publishCount, setPublishCount] = useState<number>(0);
  const [publishEvent, setPublishEvent] = useState<any>();
  const [isRelayStatusOpen, setIsRelayStatusOpen] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // @ts-ignore
  const { feed, setFeed } = useContext(FeedContext);

  // function getTValues(tags: string[][]) {
  //   return tags
  //     .filter((subTags) => subTags[0] === "t")
  //     .map((subTags) => subTags[1])
  //     .filter((t) => t.length <= 20);
  // }

  useEffect(() => {
    return () => {
      setBlog({
        title: null,
        summary: null,
        content: null,
        image: null,
        identifier: null,
        publishedAt: null,
      });
      setIsPublishing(false);
    };
  }, []);

  useEffect(() => {
    setSummary(blog.summary);
    setImage(blog.image);
  }, [blog]);

  useEffect(() => {
    console.log("PUBLISH SUCCESS:", publishSuccess);
    console.log("PUBLISH FAILED:", publishFailed);
    console.log("PUBLISH TOGGLED:", toggledRelays);
    console.log("PUBLISH SUCCESS LENGTH:", publishSuccess.length);
    console.log("PUBLISH FAILED LENGTH:", publishFailed.length);
    console.log("PUBLISH TOGGLED LENGTH:", toggledRelays.length);
    if (publishSuccess.length + publishFailed.length < toggledRelays.length) {
      if (publishEvent) {
        publishToRelay(publishEvent);
      }
    }
    console.log("PUBLISH COUNT:", publishCount);
  }, [publishSuccess, publishFailed]);

  useEffect(() => {
    if (publishCount >= toggledRelays.length) {
      setIsOpen(false);
      setIsRelayStatusOpen(true);
    }
  }, [publishCount]);

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

  const toggleRelay = (e: any) => {
    let relays = toggledRelays;
    if (e.target.checked) {
      relays.push(e.target.value);
    } else {
      relays = relays.filter((relay) => relay !== e.target.value);
    }
    setToggledRelays(relays);
  };

  const publishToRelay = (event: any) => {
    const onOk = async () => {};

    const onSeen = async (url: string) => {
      let relayUrl = url.replace("wss://", "");
      let feedKey = `latest_${relayUrl}`;
      feed[feedKey] = null;
      let profileFeedKey = `profilefeed_${relayUrl}_${publicKey}`;
      feed[profileFeedKey] = null;
      setFeed(feed);
      if (!publishSuccess.includes(url)) {
        setPublishSuccess([...publishSuccess, url]);
      }
      setPublishCount(publishCount + 1);
    };

    const onFailed = async (url: string) => {
      setPublishFailed([...publishFailed, url]);
      setPublishCount(publishCount + 1);
    };

    publish([toggledRelays[publishCount]], event, onOk, onSeen, onFailed);
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
    event = await NostrService.signEvent(event);

    console.log("EVENT:", event);

    console.log("PUBLISHING TO:", toggledRelays);

    setPublishEvent(event);

    setIsPublishing(true);
    publishToRelay(event);
  };

  const handleDismiss = () => {
    setIsRelayStatusOpen(false);
    router.push("/u/" + nip19.npubEncode(publicKey));
  };

  return (
    <>
      {pathname === "/write" ? (
        <>
          <Button size="sm" color="green" onClick={handlePublish}>
            Publish
          </Button>
          <PublishPopup
            title=""
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            className="h-1/2 max-h-192 opacity-70 inset-0 overflow-auto scroll-smooth border-none"
          >
            <PublishPopupInput
              value={summary ?? ""}
              onChange={(evn) => setSummary(evn.target.value)}
              label="Summary"
            />
            <PublishPopupInput
              value={image ?? ""}
              onChange={(e) => setImage(e.target.value)}
              label="Hero Image"
            />
            <div>
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
            </div>
            <div></div>
            <div className="row-span-2 justify-self-center">
              <div>
                {allRelays.map((relay: string, index: number) => (
                  <PopupCheckbox
                    key={relay}
                    label={relay}
                    value={relay}
                    onClick={toggleRelay}
                    defaultChecked={relay === relayUrl ? true : false}
                  ></PopupCheckbox>
                ))}
              </div>
            </div>
            <div className="justify-self-center self-center pt-3">
              {!isPublishing ? (
                <Button
                  size="sm"
                  color="green"
                  onClick={submitPublish}
                  className="w-[8rem]"
                >
                  Publish Now
                </Button>
              ) : (
                <p>publishing...</p>
              )}
            </div>
          </PublishPopup>
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

      <Popup
        title="Relay Status"
        isOpen={isRelayStatusOpen}
        setIsOpen={setIsRelayStatusOpen}
      >
        {publishSuccess.length > 0 && (
          <>
            <h4 className="text-lg font-semibold pb-4">
              Successful published to:
            </h4>
            <ul className="flex flex-col gap-2">
              {publishSuccess.map((relay: string) => {
                return <li>✅ {relay.replace("wss://", "")}</li>;
              })}
            </ul>
          </>
        )}
        {publishFailed.length > 0 && (
          <>
            <h4 className="text-lg font-semibold pb-4">Failed to publish:</h4>
            <ul className="flex flex-col gap-2">
              {publishFailed.map((relay: string) => {
                return <li>❌ {relay.replace("wss://", "")}</li>;
              })}
            </ul>
          </>
        )}

        <Button color="green" variant="ghost" onClick={handleDismiss} size="xs">
          Dismiss
        </Button>
      </Popup>
    </>
  );
};

export default WriteButton;
