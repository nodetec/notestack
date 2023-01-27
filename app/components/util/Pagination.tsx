"use client";
import Button from "@/app/Button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IoChevronDown } from "react-icons/io5";
import { useMediaQuery } from "react-responsive";

interface PaginationProps {
  numPages: number;
}

export default function Pagination({ numPages }: PaginationProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isSmallScreen = useMediaQuery({ minWidth: 640 });

  const pageSearchParam = searchParams.get("page");

  const currentPage = pageSearchParam ? parseInt(pageSearchParam) : 1;
  const router = useRouter();

  const navigate = (page: number) => {
    router.push(`${pathname}?page=${page}`);
  };

  return (
    <div className="flex justify-between gap-2 mt-4">
      <Button
        
        variant="outline"
        icon={<IoChevronDown className="rotate-90" />}
        size="sm"
        title="Previous page"
        onClick={() => navigate(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        {isSmallScreen ? "Prev" : ""}
      </Button>

      <div className="flex items-center gap-2">
        {currentPage > 2 && (
          <Button
            
            variant="ghost"
            size="sm"
            onClick={() => navigate(1)}
          >
            1
          </Button>
        )}
        {currentPage > 3 && <span>...</span>}
        {[...Array(numPages + 1)].map((_, i) => {
          if (i === 0) return null;
          if (
            currentPage === i - 1 ||
            currentPage === i ||
            currentPage === i + 1
          ) {
            return (
              <Button
                key={i}
                
                variant={i === currentPage ? "solid" : "ghost"}
                size="sm"
                onClick={() => navigate(i)}
              >
                {i.toString()}
              </Button>
            );
          }
        })}
        {numPages > currentPage + 2 && <span>...</span>}
        {numPages >= currentPage + 2 && (
          <Button
            
            variant="ghost"
            size="sm"
            onClick={() => navigate(numPages)}
          >
            {numPages.toString()}
          </Button>
        )}
      </div>

      <Button
        
        variant="outline"
        icon={<IoChevronDown className="-rotate-90" />}
        title="Next page"
        size="sm"
        onClick={() => navigate(currentPage + 1)}
        disabled={currentPage >= numPages}
        iconAfter
      >
        {isSmallScreen ? "Next" : ""}
      </Button>
    </div>
  );
}
