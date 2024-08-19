"use client";

import { Fragment } from "react";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { getFirstImage, parseContent } from "~/lib/markdown";
import { getPosts, getTag, makeNaddr } from "~/lib/nostr";
import { useAppState } from "~/store";
import Image from "next/image";
import Link from "next/link";

export function ClientArticleFeed() {
  const pool = useAppState((state) => state.pool);
  const relays = useAppState((state) => state.relays);

  const { data } = useQuery({
    queryKey: ["posts"],
    refetchOnWindowFocus: false, // Disable refetching on window focus for now
    queryFn: () => getPosts(pool, relays),
  });

  return (
    <div className="min-w-3xl mx-auto mt-12 flex w-full max-w-3xl flex-col items-center gap-y-8">
      {data?.map((post) => (
        <Fragment key={post.id}>
          <Card className="w-full border-none bg-secondary shadow-none">
            <Link href={`/a/${makeNaddr(post, relays)}`}>
              <CardContent className="flex items-center p-4 md:p-6">
                <div className="md:flex-1 md:p-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <span>Technology</span>
                      <span className="mx-2">•</span>
                      <span>{"Chris"}</span>
                    </div>
                  </div>
                  <h3 className="mt-2 text-[1.35rem] font-bold">
                    {getTag("title", post.tags)}
                  </h3>
                  {/* <p className="mt-2 text-muted-foreground">{post.content}</p> */}
                  <div className="mt-2 line-clamp-3 text-ellipsis whitespace-break-spaces pt-0 text-muted-foreground">
                    {parseContent(post.content) || "No content \n "}
                  </div>
                </div>
                <Image
                  className="ml-2 h-14 w-20 rounded-md object-cover md:ml-14 md:h-28 md:w-40"
                  src={
                    getTag("image", post.tags) ??
                    getFirstImage(post.content) ??
                    ""
                  }
                  width={160}
                  height={112}
                  alt=""
                />
              </CardContent>
            </Link>
          </Card>
          <div className="w-full px-4">
            <Separator />
          </div>
        </Fragment>
      ))}
    </div>
  );
}
