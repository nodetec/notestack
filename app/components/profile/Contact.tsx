import { DUMMY_PROFILE_API } from "@/app/lib/constants";
import Link from "next/link";
import { nip19 } from "nostr-tools";
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

  return (
    <li className="hover:bg-secondary transition-colors opacity-70 hover:opacity-100 rounded-full">
      <Link
        href={`/u/${nip19.npubEncode(pubkey)}`}
        className="text-accent text-base flex items-center gap-2 py-2 pl-2 pr-4"
      >
        <img
          className="rounded-full w-8 h-8"
          src={contentObj?.picture || DUMMY_PROFILE_API(name || npub)}
          alt={name}
        />
        <span className="text-zinc-400">{name}</span>
        <span className="text-zinc-500">{npub}</span>
      </Link>
    </li>
  );
}
