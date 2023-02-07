import Button from "@/app/Button";
import { DUMMY_PROFILE_API } from "@/app/lib/constants";
import Tooltip from "@/app/Tooltip";
import Link from "next/link";
import { nip19 } from "nostr-tools";
import { useState } from "react";
import { BiDotsHorizontalRounded } from "react-icons/bi";
import { shortenHash } from "../../lib/utils";

export default function Contact({ contact, followingsCount }: any) {
  let contentObj;
  let name;
  let about;
  let picture;
  let npub: any = "";

  const pubkey = contact.pubkey;
  const [showTooltip, setShowTooltip] = useState(false);

  try {
    npub = shortenHash(nip19.npubEncode(contact.pubkey));
    const content = contact?.content;
    contentObj = JSON.parse(content);
    name = contentObj?.name;
    about = contentObj?.about;
    picture = contentObj?.picture;
  } catch (e) {
    // console.log("Error parsing content");
  }

  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  return (
    <li className="flex items-center justify-between gap-2">
      <Link
        href={`/u/${nip19.npubEncode(pubkey)}`}
        className="text-sm flex items-center gap-4 py-1"
        onClick={scrollToTop}
      >
        <img
          className="rounded-full w-5 h-5 object-cover bg-light-gray"
          src={contentObj?.picture || DUMMY_PROFILE_API(npub!)}
          alt=""
        />
        <span className="text-gray hover:text-gray-hover hover:underline">
          {name || npub}
        </span>
      </Link>
      <Tooltip
        show={showTooltip}
        toggle={() => setShowTooltip((current) => !current)}
        Component={
          <Button
            variant="solid"
            color="transparent"
            size="sm"
            icon={<BiDotsHorizontalRounded size="18" />}
          />
        }
      >
        <div className="w-[17rem]">
          <Link
            href={`/u/${nip19.npubEncode(pubkey)}`}
            className="text-sm flex items-center gap-2 pb-3"
            onClick={scrollToTop}
          >
            <img
              className="rounded-full w-7 h-7 object-cover bg-light-gray"
              src={contentObj?.picture || DUMMY_PROFILE_API(npub!)}
              alt=""
            />
            <h3 className="text-black font-medium text-lg">{name || npub}</h3>
          </Link>
          <p className="text-sm text-gray-hover pb-2 border-b border-b-light-gray">
            {contentObj?.about}
          </p>
          {/* <div className="flex items-center gap-2 justify-between pt-2"> */}
          {/* <span className="text-gray font-xs"> */}
          {/*   {followingsCount} Followings */}
          {/* </span> */}
          {/* <Button */}
          {/*   color="green" */}
          {/*   size="xs" */}
          {/*   className="py-1 px-2 text-xs" */}
          {/*   // FIXME: need follow functionality */}
          {/* > */}
          {/*   Follow */}
          {/* </Button> */}
          {/* </div> */}
        </div>
      </Tooltip>
    </li>
  );
}
