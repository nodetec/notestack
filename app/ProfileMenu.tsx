import Link, { LinkProps } from "next/link";
import { DetailedHTMLProps, Fragment, HTMLAttributes } from "react";
import { IconType } from "react-icons";
import { HiOutlineUser, HiOutlineBookmark } from "react-icons/hi";
import { nip19 } from "nostr-tools";

interface ProfileMenuProps {
  pubkey: string;
  toggleMenu: (show: boolean) => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ pubkey, toggleMenu }) => {
  const npub = nip19.npubEncode(pubkey);
  return (
    <Fragment>
      <div className="flex flex-col rounded-md bg-white shadow-profile-menu border border-light-gray absolute z-40 right-0 -bottom-4 translate-y-full text-sm min-w-max">
        <GroupMenu>
          <Item
            onClick={() => toggleMenu(false)}
            label="Profile"
            href={`/u/` + npub}
            Icon={HiOutlineUser}
          />
          <Item
            onClick={() => toggleMenu(false)}
            label="Bookmark"
            href={`/u/` + npub}
            Icon={HiOutlineBookmark}
          />
        </GroupMenu>
        <GroupMenu>
          <Item
            onClick={() => toggleMenu(false)}
            label="Settings"
            href="/settings"
          />
        </GroupMenu>
      </div>
      <div className="fixed inset-0 z-30" onClick={() => toggleMenu(false)} />
    </Fragment>
  );
};

interface ItemProps extends LinkProps {
  label: string;
  href: string;
  className?: string;
  Icon?: IconType;
}

const Item: React.FC<ItemProps> = ({
  label,
  href,
  Icon,
  className = "",
  ...props
}) => (
  <Link
    href={href}
    className={`flex items-center px-6 py-2 gap-4 cursor-pointer text-gray hover:text-gray-hover ${className}`}
    {...props}
  >
    {Icon ? <Icon size="20" /> : null}
    <span>{label}</span>
  </Link>
);

interface GroupMenuProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

const GroupMenu: React.FC<GroupMenuProps> = ({
  className = "",
  children,
  ...props
}) => (
  <div className={`py-4 border-b border-b-light-gray ${className}`} {...props}>
    {children}
  </div>
);

export default ProfileMenu;
