import { useNostrEvents } from "nostr-react";
import { useContext } from "react";
import { KeysContext } from "./context/keys-provider";

const Lists: React.FC = () => {
  // @ts-ignore
  const { keys } = useContext(KeysContext);

  const { events: bookmarkEvents } = useNostrEvents({
    filter: {
      kinds: [30000],
      authors: [keys.publicKey],
      limit: 100,
    },
  });

  console.log("EVENTS FROM LISTS:", bookmarkEvents);

  return (
    <div className="py-8">
      <p>lists page</p>
    </div>
  );
};

export default Lists;
