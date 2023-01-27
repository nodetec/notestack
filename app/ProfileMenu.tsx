import Link from "next/link";
import { DetailedHTMLProps, Fragment, HTMLAttributes } from "react";
import { IconType } from "react-icons";
import { HiOutlineUser, HiBookmark } from "react-icons/hi";
import { nip19 } from "nostr-tools";

interface ProfileMenuProps {
  pubkey: string;
  toggleMenu: (show: boolean) => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ pubkey, toggleMenu }) => {
  const npub = nip19.npubEncode(pubkey);
  return (
    <Fragment>
    <div className="flex flex-col rounded-md bg-white shadow-profile-menu absolute z-40 right-0 -bottom-4 translate-y-full">
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
          Icon={HiBookmark}
        />
      </GroupMenu>
    </div>
    <div className="fixed inset-0 z-30" onClick={() => toggleMenu(false)} />
    </Fragment>
  );
};

interface ItemProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  label: string;
  href: string;
  Icon: IconType;
}

const Item: React.FC<ItemProps> = ({
  label,
  href,
  Icon,
  className = "",
  ...props
}) => (
  <div
    className={`flex items-center p-2 gap-4 cursor-pointer text-gray hover:text-gray-hover ${className}`}
    {...props}
  >
    <Icon size="20" />
    <Link href={href}>{label}</Link>
  </div>
);

interface GroupMenuProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> { }

const GroupMenu: React.FC<GroupMenuProps> = ({
  className = "",
  children,
  ...props
}) => (
  <div
    className={`py-4 px-6 border-b border-b-gray border-opacity-50 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export default ProfileMenu;
