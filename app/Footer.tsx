import { IconType } from "react-icons";
import {
  AiFillGithub,
  AiFillHeart,
  AiOutlineTwitter,
  AiFillYoutube,
} from "react-icons/ai";
import { GiOstrich } from "react-icons/gi";
import { MdExtension } from "react-icons/md";
import { BsFillLightningChargeFill } from "react-icons/bs";

interface ISocialLink {
  name: string;
  url: string;
  Icon: IconType;
}

const SOCIALS: ISocialLink[] = [
  {
    name: "YouTube",
    url: "https://www.youtube.com/@chrisatmachine",
    Icon: AiFillYoutube,
  },
  {
    name: "Nostr",
    url: "https://blogstack.io/u/npub1ygzj9skr9val9yqxkf67yf9jshtyhvvl0x76jp5er09nsc0p3j6qr260k2",
    Icon: GiOstrich,
  },
  {
    name: "Donate",
    url: "https://getalby.com/chrisatmachine",
    Icon: AiFillHeart,
  },
  {
    name: "GitHub",
    url: "https://github.com/nodetec/NoteBin",
    Icon: AiFillGithub,
  },
  {
    name: "Nostr Extension",
    url: "https://github.com/fiatjaf/nos2x",
    Icon: MdExtension,
  },
  {
    name: "Lightning Wallet",
    url: "https://getalby.com",
    Icon: BsFillLightningChargeFill,
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
              <social.Icon />
            </span>
            {social.name}
          </a>
        </li>
      ))}
    </ul>
  </footer>
);

export default Footer;
