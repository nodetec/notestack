"use client";

import React from "react";

import { Button } from "~/components/ui/button";
import { ChevronLeftIcon, EllipsisVertical } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  naddr: string;
};

export const ArticleHeader = ({ naddr }: Props) => {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-40 mx-auto mb-6 flex max-w-2xl justify-between bg-secondary/95 pb-2 pt-4 backdrop-blur transition-colors duration-500 sm:px-4">
      <Button
        onClick={() => router.back()}
        className="bg-muted/80 hover:bg-muted/70"
        variant="secondary"
        size="icon"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </Button>
      <Button
        className="bg-muted/80 hover:bg-muted/70"
        variant="secondary"
        size="icon"
      >
        <EllipsisVertical className="h-5 w-5" />
      </Button>
    </div>
  );
};
