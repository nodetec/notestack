import { type Link, type Root } from "mdast";
import { type Event } from "nostr-tools";
import rehypeExternalLinks from "rehype-external-links";
import rehypeStringify from "rehype-stringify";
import remarkHtml from "remark-html";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkYoutube from "remark-youtube";
import { unified, type Plugin } from "unified";
import { visit } from "unist-util-visit";

import { getTag } from "./nostr";

export function getFirstImage(markdown: string) {
  const regex = /!\[.*\]\((.*)\)/;
  const match = regex.exec(markdown);

  if (match) {
    return match[1];
  }

  return undefined;
}

export function cleanMarkdown(mdText: string) {
  // Remove headers
  const noHeaders = mdText.replace(/^\s*#{1,6}\s+.*$/gm, "");

  // Remove links (in format [text](url) and [text][id])
  let noLinks = noHeaders.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  noLinks = noLinks.replace(/\[([^\]]+)\]\[[^\]]+\]/g, "$1");

  // Remove images (in format ![alt text](url))
  const noImages = noLinks.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

  // Remove code fences (``` or ~~~ and the code between them)
  const noCodeFences = noImages.replace(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g, "");

  // Remove inline code (`code`)
  let cleanText = noCodeFences.replace(/`([^`]+)`/g, "");

  // Trim extra blank lines
  cleanText = cleanText.replace(/\n{2,}/g, "\n").trim();

  if (cleanText === "") {
    return "No content";
  }

  return cleanText;
}

interface RemoveHeadingPluginOptions {
  headingText?: string;
}

const removeHeadingPlugin: Plugin<[RemoveHeadingPluginOptions?], Root> = ({
  headingText,
} = {}) => {
  if (!headingText) {
    return () => {};
  }

  return (tree: Root) => {
    tree.children = tree.children.filter((node) => {
      if (node.type === "heading") {
        const headingNode = node;
        const textNode = headingNode.children.find(
          (child) => child.type === "text" && child.value === headingText,
        );

        if (textNode) {
          return false; // Remove this heading
        }
      }
      return true; // Keep other nodes
    });
  };
};

// Define the options type
interface NostrLinkPluginOptions {
  baseUrls: {
    naddr1?: string;
    npub1?: string;
    nprofile1?: string;
    nevent1?: string;
    note1?: string;
  };
}

// Define the plugin with options
const nostrLinkPlugin: Plugin<[NostrLinkPluginOptions?], Root> = (options) => {
  if (!options?.baseUrls) {
    return () => {};
  }
  const { baseUrls } = options;

  return (tree: Root) => {
    visit(tree, "link", (node: Link) => {
      if (node.url.startsWith("nostr:naddr1") && baseUrls?.naddr1) {
        const nostrId = node.url.replace("nostr:", "");
        node.url = `${baseUrls.naddr1}${nostrId}`;
      } else if (node.url.startsWith("nostr:npub1") && baseUrls?.npub1) {
        const nostrId = node.url.replace("nostr:", "");
        node.url = `${baseUrls.npub1}${nostrId}`;
      } else if (
        node.url.startsWith("nostr:nprofile1") &&
        baseUrls?.nprofile1
      ) {
        const nostrId = node.url.replace("nostr:", "");
        node.url = `${baseUrls.nprofile1}${nostrId}`;
      } else if (node.url.startsWith("nostr:nevent1") && baseUrls?.nevent1) {
        const nostrId = node.url.replace("nostr:", "");
        node.url = `${baseUrls.nevent1}${nostrId}`;
      } else if (node.url.startsWith("nostr:note1") && baseUrls?.note1) {
        const nostrId = node.url.replace("nostr:", "");
        node.url = `${baseUrls.note1}${nostrId}`;
      }
    });
  };
};

export function processArticle(event: Event | undefined) {
  if (!event) {
    return "";
  }
  // console.log("Processing article", event);
  const title = getTag("title", event.tags);
  // const image = getTag("image", event.tags);

  const processedContent = unified()
    .use(remarkParse)
    .use(nostrLinkPlugin, {
      baseUrls: {
        naddr1: "https://notestack.com/a/",
        npub1: "https://notestack.com/",
        nprofile1: "https://nostrudel.ninja/#/u/",
        nevent1: "https://nostrudel.ninja/#/n/",
        note1: "https://nostrudel.ninja/#/n/",
      },
    })
    .use(removeHeadingPlugin, { headingText: title })
    .use(remarkHtml)
    .use(remarkYoutube)
    .use(remarkRehype)
    .use(rehypeExternalLinks, {
      target: "_blank",
      rel: ["noopener", "noreferrer"],
    })
    .use(rehypeStringify)
    .processSync(event.content)
    .toString();

  return processedContent;
}

export function readingTime(markdown: string | undefined): string {
  if (!markdown) {
    return "0 min read";
  }
  const wordsPerMinute = 200;
  const words = markdown
    .replace(/[#*>\-`~\[\]\(\)]/g, "") // Remove markdown syntax
    .trim()
    .split(/\s+/).length; // Split by whitespace to count words

  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}
