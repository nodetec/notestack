import Link from "next/link";
import { useNostrEvents } from "nostr-react";
import Contact from "./Contact";

export default function Contacts({ userContacts, npub }: any) {
  const contactPublicKeys = userContacts.map((contact: any) => {
    return contact[1];
  });

  const { events: contacts } = useNostrEvents({
    filter: {
      kinds: [0],
      authors: contactPublicKeys,
      limit: 5,
    },
  });

  let uniqueContacts = contacts.filter(
    (obj, index, self) =>
      index === self.findIndex((t) => t.pubkey === obj.pubkey)
  );

  return (
    <div className="flex flex-col gap-4 pt-10">
      <h4 className="text-sm font-bold">Following</h4>
      <ul className="flex flex-col gap-2">
        {uniqueContacts &&
          uniqueContacts
            .slice(0, 5)
            .map((contact: any) => (
              <Contact key={contact.id} contact={contact} />
            ))}
      </ul>
      <Link href={`/${npub}/following`} className="text-gray hover:text-gray-hover text-xs">See all ({uniqueContacts.length})</Link> 
    </div>
  );
}
