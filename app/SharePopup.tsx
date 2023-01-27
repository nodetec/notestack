import { AnchorHTMLAttributes, DetailedHTMLProps, FC } from "react";
import { IconType } from "react-icons";
import { AiOutlineTwitter, AiFillLinkedin } from "react-icons/ai";
import { FaRedditAlien, FaTelegramPlane } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { RiWhatsappFill } from "react-icons/ri";
import Truncate from "./components/util/Truncate";
import useHover from "./hooks/useHover";
import Popup, { PopupProps } from "./Popup";

interface SharePopupProps extends PopupProps {
  link: string;
}

const MESSAGE = "Checkout this note on notebin";
const SOCLIAL_LINKS = [
  {
    label: "Twitter",
    url: (link: string) =>
      `https://twitter.com/intent/tweet?text=${MESSAGE}&url=${link}`,
    Icon: AiOutlineTwitter,
    color: "#1DA1F2",
  },
  {
    label: "LinkedIn",
    Icon: AiFillLinkedin,
    color: "#0077B5",
    url: (link: string) =>
      `https://www.linkedin.com/shareArticle?url=${link}&title=${MESSAGE}&mini=true`,
  },
  {
    label: "Reddit",
    url: (link: string) =>
      `https://www.reddit.com/submit?url=${link}&title=${MESSAGE}`,
    Icon: FaRedditAlien,
    color: "#FF4500",
  },
  {
    label: "WhatsApp",
    url: (link: string) => `https://wa.me/?text=${MESSAGE} ${link}`,
    Icon: RiWhatsappFill,
    color: "#25D366",
  },
  {
    label: "Telegram",
    url: (link: string) => `https://t.me/share/url?url=${link}&text=${MESSAGE}`,
    Icon: FaTelegramPlane,
    color: "#0088CC",
  },
  {
    label: "Email",
    url: (link: string) => `mailto:?subject=${MESSAGE}&body=${link}`,
    Icon: MdEmail,
    color: "#D44638",
  },
];

const SharePopup: FC<SharePopupProps> = ({ link, ...props }) => {
  return (
    <Popup {...props}>
      <div className="flex gap-2 items-center flex-wrap ">
        {SOCLIAL_LINKS.map(({ label, url, color, Icon }, idx) => (
          <SocialLink
            key={idx}
            href={url(link)}
            Icon={Icon}
            label={label}
            color={color}
          />
        ))}
      </div>
      <div className="flex items-center justify-center bg-secondary p-2 px-4 rounded-md">
        <Truncate content={link} length={20} />
      </div>
    </Popup>
  );
};

interface SocialLinkProps
  extends DetailedHTMLProps<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  > {
  label?: string;
  Icon: IconType;
  color: string;
}

const SocialLink: FC<SocialLinkProps> = ({ label, color, Icon, ...props }) => {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="flex item-center justify-center gap-2 text-sm font-bold p-2 bg-secondary rounded-md flex-1 hover:shadow-accent hover:scale-101 hover:shadow-sm transition-colors"
      {...props}
      {...useHover({ color })}
    >
      <span>
        <Icon className="w-6 h-6" />
      </span>
      <span>{label}</span>
    </a>
  );
};

export default SharePopup;
