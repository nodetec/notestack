import { marked } from 'marked';
import { Blog } from './nostr/types';
import { blogToNaddr } from './nostr/naddr';
import { Profile } from './nostr/profiles';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://notestack.com';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function markdownToHtml(markdown: string): string {
  try {
    return marked.parse(markdown, { async: false }) as string;
  } catch {
    return escapeXml(markdown);
  }
}

interface GenerateRSSOptions {
  title: string;
  description: string;
  link: string;
  blogs: Blog[];
  profiles?: Map<string, Profile>;
  relays?: string[];
}

export function generateRSS({
  title,
  description,
  link,
  blogs,
  profiles,
  relays = [],
}: GenerateRSSOptions): string {
  const items = blogs.map((blog) => {
    const naddr = blogToNaddr(blog, relays);
    const articleUrl = `${SITE_URL}/${naddr}`;
    const pubDate = new Date((blog.publishedAt || blog.createdAt) * 1000).toUTCString();
    const author = profiles?.get(blog.pubkey);
    const authorName = author?.name || blog.pubkey.slice(0, 8);
    const contentHtml = markdownToHtml(blog.content);

    return `    <item>
      <title>${escapeXml(blog.title || 'Untitled')}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(authorName)}</author>
      <description>${escapeXml(blog.summary || '')}</description>
      <content:encoded><![CDATA[${contentHtml}]]></content:encoded>
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(title)}</title>
    <description>${escapeXml(description)}</description>
    <link>${link}</link>
    <atom:link href="${link}" rel="self" type="application/rss+xml"/>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>NoteStack</generator>
${items.join('\n')}
  </channel>
</rss>`;
}

export function rssResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300', // Cache for 5 minutes
    },
  });
}
