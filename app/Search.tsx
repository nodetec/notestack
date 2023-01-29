"use client";
import { useNostr } from "nostr-react";
import { useEffect, useState } from "react";
import { BsSearch } from "react-icons/bs";

const Search = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { connectedRelays } = useNostr();

  const handleChange = (event: any) => {
    setSearchTerm(event.target.value);
  };

  useEffect(() => {
    connectedRelays.forEach((relay) => {
      let sub = relay.sub([
        {
          kinds: [2222],
          "#t": [searchTerm]
        },
      ]);
      sub.on("event", (event: Event) => {
        console.log("we got the event we wanted:", event);
      });
      sub.on("eose", () => {
        console.log("EOSE");
        sub.unsub();
      });
    });
  }, [searchTerm]);

  return (
    <div className="flex flex-row items-center gap-2 pl-4 py-2 bg-neutral-100 rounded-full">
      <BsSearch className="text-neutral-500" size="15" />
      <input
        placeholder="this doesn't work lol"
        className="bg-neutral-100 outline-none"
        type="text"
        value={searchTerm}
        onChange={handleChange}
      />
    </div>
  );
};

export default Search;
