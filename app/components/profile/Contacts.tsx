import { useNostrEvents } from "nostr-react";
import Contact from "./Contact";

export default function Contacts({ userContacts }: any) {
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
    <div className="flex flex-col gap-4">
      <h4 className="text-xl font-bold pt-8">Following</h4>
      <ul className="flex flex-col gap-2">
        {uniqueContacts &&
          uniqueContacts
            .slice(0, 5)
            .map((contact: any) => (
              <Contact key={contact.id} contact={contact} />
            ))}
      </ul>
    </div>
  );
}
