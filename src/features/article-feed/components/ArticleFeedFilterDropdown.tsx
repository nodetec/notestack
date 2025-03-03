import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import useAuth from "~/hooks/useAuth";
import { useFollowEvent } from "~/hooks/useFollowEvent";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { useRouter } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

export function ArticleFeedFilterDropdown({ children }: Props) {
  const router = useRouter();

  const { userPublicKey } = useAuth();

  const userFollowEvent = useFollowEvent(userPublicKey, DEFAULT_RELAYS);

  function handleChangeFilter(filter: string) {
    if (filter === "featured") router.push(`/`);
    if (filter === "following") router.push(`/?feed=following`);
    if (filter === "latest") router.push(`/?feed=latest`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>People</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => handleChangeFilter("featured")}>
            Featured
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleChangeFilter("latest")}>
            Latest
          </DropdownMenuItem>
          {userFollowEvent.data && (
            <DropdownMenuItem onSelect={() => handleChangeFilter("following")}>
              Following
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
