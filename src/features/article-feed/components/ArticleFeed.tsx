/* eslint-disable @next/next/no-img-element */
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "~/components/ui/card";
import { useAppState } from "~/store";
import Link from "next/link";

const relays = ["wss://relay.notestack.com", "wss://nos.lol"];

const getTag = (name: string, tags: string[][]) => {
  const [itemTag] = tags.filter((tag: string[]) => tag[0] === name);
  const [, item] = itemTag ?? [, undefined];
  return item;
};

function parseContent(markdownContent: string) {
  // Split the content into lines
  const lines = markdownContent.split("\n");

  // Check if the first line is a header
  const firstLine = lines[0]?.trim();
  if (!firstLine) {
    return "";
  }
  const isHeader = /^#+\s+(.*)$/.test(firstLine);

  // Determine the starting index for processing lines
  const startIndex = isHeader ? 1 : 0;

  // Filter out empty lines and lines containing Markdown image elements
  const filteredLines = lines
    .slice(startIndex) // Start from the second line if the first line is a header
    .filter((line) => {
      const trimmedLine = line.trim();
      return trimmedLine !== "" && !/^!\[.*\]\(.*\)$/.test(trimmedLine);
    });

  // Join the lines back together with newlines
  const content = filteredLines.join("\n");

  return content;
}

function getFirstImage(markdown: string) {
  const regex = /!\[.*\]\((.*)\)/;
  const match = regex.exec(markdown);

  if (match) {
    return match[1];
  }

  return "";
}

export function ArticleFeed() {
  const pool = useAppState((state) => state.pool);

  async function getPosts() {
    const events = await pool.querySync(relays, { kinds: [30023], limit: 10 });
    console.log("events", events);
    return events;
  }

  const { data } = useQuery({
    queryKey: ["posts"],
    refetchOnWindowFocus: false, // Disable refetching on window focus for now
    queryFn: () => getPosts(),
  });

  return (
    // <div className="flex flex-col">
    <div className="mx-auto mt-12 flex w-full min-w-3xl max-w-3xl flex-col items-center gap-y-8">
      {data?.map((post) => (
        <Card className="w-full" key={post.id}>
          <CardContent className="flex items-center p-6">
            <div className="p-4 md:flex-1 md:p-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <Link href="#" className="hover:underline" prefetch={false}>
                    {"Technology"}
                  </Link>
                  <span className="mx-2">•</span>
                  <span>{"Chris"}</span>
                </div>
              </div>
              <h3 className="mt-2 text-xl font-bold">
                {getTag("title", post.tags)}
              </h3>
              {/* <p className="mt-2 text-muted-foreground">{post.content}</p> */}
              <div className="mt-2 text-ellipsis line-clamp-3 whitespace-break-spaces pt-0 text-muted-foreground">
                {parseContent(post.content) || "No content \n "}
              </div>
            </div>

            <img
              src={ getTag("image", post.tags) || getFirstImage(post.content)}
              alt="Blog Post Image"
              className="ml-14 h-28 w-40 rounded-md object-cover"
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
