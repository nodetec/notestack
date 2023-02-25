import {
  Extension,
  GitHub,
  Heart,
  LightningCharge,
  Ostrich,
  YouTube,
  IconType,
} from "@/app/icons";

interface ISocialLink {
  name: string;
  url: string;
  Icon: IconType;
}

const SOCIALS: ISocialLink[] = [
  {
    name: "YouTube",
    url: "https://www.youtube.com/@chrisatmachine",
    Icon: YouTube,
  },
  {
    name: "Nostr",
    url: "https://blogstack.io/u/npub1ygzj9skr9val9yqxkf67yf9jshtyhvvl0x76jp5er09nsc0p3j6qr260k2",
    Icon: Ostrich,
  },
  {
    name: "Donate",
    url: "https://getalby.com/chrisatmachine",
    Icon: Heart,
  },
  {
    name: "GitHub",
    url: "https://github.com/nodetec/blogstack",
    Icon: GitHub,
  },
  {
    name: "Nostr Extension",
    url: "https://github.com/fiatjaf/nos2x",
    Icon: Extension,
  },
  {
    name: "Lightning Wallet",
    url: "https://getalby.com",
    Icon: LightningCharge,
  },
];

const Footer = () => (
  <footer className="fixed bottom-6 mx-auto">
    <ul className="items-center justify-start flex gap-3 flex-wrap">
      {SOCIALS.map((social) => (
        <li key={social.url}>
          <a
            href={social.url}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="flex items-center gap-1 text-gray text-xs hover:text-accent text-center"
          >
            <span>
              <social.Icon size={12} />
            </span>
            {social.name}
          </a>
        </li>
      ))}
    </ul>
  </footer>
);

export default Footer;
