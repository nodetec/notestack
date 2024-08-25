import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

export function ArticleFeedFilterDropdown({ children }: Props) {
  const router = useRouter();

  function handleChangeFilter(filter: string) {
    if (filter === "featured") router.push(`/`);
    if (filter === "following") router.push(`/?feed=following`);
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
          <DropdownMenuItem onSelect={() => handleChangeFilter("following")}>
            Following
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
