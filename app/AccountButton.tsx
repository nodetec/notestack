import Link from "next/link";
import { useProfile } from "nostr-react";
import { nip19 } from "nostr-tools";
import { DUMMY_PROFILE_API } from "./lib/constants";

interface AccountButtonProps {
  pubkey: string;
}

export default function AccountButton({ pubkey }: AccountButtonProps) {
  const { data } = useProfile({
    pubkey,
  });

  return (
    <Link href={`/u/` + nip19.npubEncode(pubkey)}>
      <span className="flex gap-2 rounded-full py-2 px-3 hover:border-current">
        <img
          className="rounded-full w-10"
          src={data?.picture || DUMMY_PROFILE_API(data?.name || data?.npub!)}
        />
      </span>
    </Link>
  );
}
