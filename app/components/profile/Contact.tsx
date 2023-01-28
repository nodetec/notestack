import Button from "@/app/Button";
import { DUMMY_PROFILE_API } from "@/app/lib/constants";
import Link from "next/link";
import { nip19 } from "nostr-tools";
import { TbDots } from "react-icons/tb";
import { shortenHash } from "../../lib/utils";

export default function Contact({ contact }: any) {
  let contentObj;
  let name;
  let about;
  let picture;

  const pubkey = contact.pubkey;
  const npub = shortenHash(nip19.npubEncode(contact.pubkey));

  try {
    const content = contact?.content;
    contentObj = JSON.parse(content);
    name = contentObj?.name;
    about = contentObj?.about;
    picture = contentObj?.picture;
  } catch (e) {
    console.log("Error parsing content");
  }

  const scrollToTop = () => {
    window.scrollTo(0, 0)
}

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
        <span className="text-gray hover:text-gray-hover hover:underline">{name || npub}</span>
      </Link>
      <Button
        color="transparent"
        icon={<TbDots />}
      />
    </li>
  );
}
