import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { createDeleteEvent } from "~/lib/events/deleteEvent";
import { publish } from "~/lib/nostr";
import { type Event } from "nostr-tools";
import { toast } from "sonner";

type ArticlePage = {
  articles: Event[];
  nextCursor?: string;
};

type ArticlesData = {
  pages: ArticlePage[];
  pageParams: unknown[];
};

// Define the type for the mutation function argument
type DeleteArticleArgs = {
  articleAddress: string;
  relays: string[];
  articleEventId: string;
};

async function deleteArticle({
  articleAddress,
  relays = [],
  articleEventId,
}: DeleteArticleArgs) {
  const deleteEvent = createDeleteEvent([30023], [], [articleAddress]);

  const published = await publish(deleteEvent, [...relays, ...DEFAULT_RELAYS]);

  if (published) {
    toast("Article deleted", {
      description: "The article has been successfully deleted.",
    });
  } else {
    toast("failed to delete article", {
      description: "There was an error deleting the article.",
    });
    return;
  }

  return articleEventId;
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation<string | undefined, unknown, DeleteArticleArgs>({
    mutationFn: deleteArticle,
    onSuccess: (_, { articleEventId }) => {
      // Find all queries that start with "articles"
      const queries = queryClient
        .getQueryCache()
        .findAll({ queryKey: ["articles"] });

      queries.forEach((query) => {
        queryClient.setQueryData<ArticlesData>(query.queryKey, (oldData) => {
          if (!oldData) {
            return oldData;
          }

          const newPages = oldData.pages.map((page) => {
            const filteredArticles = page.articles.filter(
              (event) => event.id !== articleEventId,
            );

            return {
              ...page,
              articles: filteredArticles,
            };
          });

          return {
            ...oldData,
            pages: newPages,
          };
        });
      });
    },
  });
}
//       )
