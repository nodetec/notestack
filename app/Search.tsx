"use client";
import {
  DetailedHTMLProps,
  FC,
  HTMLAttributes,
  InputHTMLAttributes,
  useContext,
  useEffect,
  useState,
} from "react";
import { BsSearch } from "react-icons/bs";
import Tooltip from "./Tooltip";
import { Event, nip19, Relay } from "nostr-tools";
import Link from "next/link";
import { DUMMY_PROFILE_API } from "./lib/constants";
import { shortenHash } from "./lib/utils";
import { AiFillTag } from "react-icons/ai";
import { RelayContext } from "./context/relay-provider";

type ResultType = {
  pubkeys: string[];
  tags: string[];
};

const Search = () => {
  // @ts-ignore
  const { connectedRelays } = useContext(RelayContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [{ tags, pubkeys }, setResults] = useState<ResultType>({
    tags: [],
    pubkeys: [],
  });

  const handleChange = (event: any) => {
    setSearchTerm(event.target.value);
  };

  const handleToggle = () => {
    if (tags.length === 0 && pubkeys.length === 0) return;
    setShowTooltip((current) => !current);
  };

  useEffect(() => {
    if (searchTerm.length > 0) {
      connectedRelays.forEach((relay: Relay) => {
        let sub = relay.sub([
          {
            kinds: [2222],
            "#t": [searchTerm],
          },
        ]);
        sub.on("event", (event: Event) => {
          console.log("we got the event we wanted:", event);
          setResults((current: ResultType) => {
            return {
              ...current,
              pubkeys: [event.pubkey],
              tags: event.tags.filter((tag) => tag[0] === "t")[0].slice(1),
            };
          });
          setShowTooltip(true);
        });
        sub.on("eose", () => {
          console.log("EOSE searched events from", relay.url);
          sub.unsub();
        });
      });
    }
  }, [searchTerm, connectedRelays]);

  return (
    <Tooltip
      show={showTooltip}
      toggle={() => handleToggle()}
      direction="bottom"
      Component={<SearchInput value={searchTerm} onChange={handleChange} />}
    >
      <div className="w-[20rem]">
        {pubkeys.length > 0 ? (
          <SearchGroup title="People">
            {pubkeys.map((id: string) => (
              <Profile key={id} pubkey={id} />
            ))}
          </SearchGroup>
        ) : null}
        {tags.length > 0 ? (
          <SearchGroup title="Tags">
            {tags.map((tag: string) => (
              <Tag key={tag} tag={tag} />
            ))}
          </SearchGroup>
        ) : null}
      </div>
    </Tooltip>
  );
};

const SearchInput: FC<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
> = (props) => (
  <div className="flex flex-row items-center gap-2 px-3 py-2 bg-light-gray bg-opacity-40 rounded-full">
    <BsSearch className="text-gray-hover" size="15" />
    <input
      placeholder="Search blogstack"
      className="bg-transparent focus:outline-none focus:ring-0"
      type="text"
      {...props}
    />
  </div>
);

interface SearchGroupProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  title: string;
}

const SearchGroup: FC<SearchGroupProps> = ({ title, children }) => {
  return (
    <div className="flex flex-col gap-2 py-4 px-2">
      <h3 className="text-gray pb-2 border-b border-b-light-gray text-sm">
        {title.toUpperCase()}
      </h3>
      {children}
    </div>
  );
};

// TODO: profile

const Profile: FC<{ pubkey: string }> = ({ pubkey }) => {
  const npub = nip19.npubEncode(pubkey);

  return (
    <Link href={"/u/" + npub} className="flex items-center gap-2 py-2">
      <img
        className="w-5 h-5 bg-light-gray rounded-full object-cover"
        // src={data?.picture || DUMMY_PROFILE_API(npub)}
        src={DUMMY_PROFILE_API(npub)}
        alt=""
      />
      {/* <span>{data?.name || shortenHash(npub)}</span> */}
      <span>{shortenHash(npub)}</span>
    </Link>
  );
};

const Tag: FC<{ tag: string }> = ({ tag }) => {
  return (
    <Link
      className="flex items-center gap-4 text-gray-hover pt-2"
      href={`/tag/${tag}`}
    >
      <AiFillTag size="20" className="text-gray" />
      <span>{tag}</span>
    </Link>
  );
};

export default Search;
