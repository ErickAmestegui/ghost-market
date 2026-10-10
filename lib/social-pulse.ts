import type { SymbolKey } from "@/data/types";

export type SocialNewsItem = {
  title: string;
  url: string;
  publishedAt: string | null;
  summary: string | null;
};

export type SocialAsset = {
  company: string;
  token: string;
  newsroom: string;
  feedUrl: string | null;
  allowedNewsHosts: string[];
  xHandle: string;
  xUrl: string;
  contract: string;
};

export const SOCIAL_ASSETS: Record<SymbolKey, SocialAsset> = {
  AAPL: {
    company: "Apple",
    token: "AAPLx",
    newsroom: "https://www.apple.com/newsroom/",
    feedUrl: "https://www.apple.com/newsroom/rss-feed.rss",
    allowedNewsHosts: ["apple.com", "www.apple.com"],
    xHandle: "@Apple",
    xUrl: "https://x.com/Apple",
    contract: "0x9d275685dc284c8eb1c79f6aba7a63dc75ec890a",
  },
  NVDA: {
    company: "NVIDIA",
    token: "NVDAx",
    newsroom: "https://nvidianews.nvidia.com/",
    feedUrl: "https://nvidianews.nvidia.com/releases.xml",
    allowedNewsHosts: ["nvidianews.nvidia.com", "blogs.nvidia.com", "www.nvidia.com"],
    xHandle: "@NVIDIA",
    xUrl: "https://x.com/nvidia",
    contract: "0xc845b2894dbddd03858fd2d643b4ef725fe0849d",
  },
  TSLA: {
    company: "Tesla",
    token: "TSLAx",
    newsroom: "https://ir.tesla.com/press?view=all",
    feedUrl: null,
    allowedNewsHosts: ["ir.tesla.com", "tesla.com", "www.tesla.com"],
    xHandle: "@Tesla",
    xUrl: "https://x.com/Tesla",
    contract: "0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0",
  },
};

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();
}

function plainText(value: string) {
  return decodeXml(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, names: string[]) {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
    if (match?.[1]) return decodeXml(match[1]);
  }
  return null;
}

function entryLink(block: string) {
  const textLink = tag(block, ["link"]);
  if (textLink && !textLink.includes("<")) return textLink;
  const href = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1];
  return href ? decodeXml(href) : null;
}

export function isAllowedNewsUrl(value: string, allowedHosts: string[]) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

export function parseOfficialFeed(xml: string, allowedHosts: string[], limit = 6): SocialNewsItem[] {
  const entries = xml.match(/<(?:item|entry)(?:\s[^>]*)?>[\s\S]*?<\/(?:item|entry)>/gi) ?? [];
  const seen = new Set<string>();
  const items: SocialNewsItem[] = [];

  for (const entry of entries) {
    const title = plainText(tag(entry, ["title"]) ?? "");
    const url = entryLink(entry);
    if (!title || !url || seen.has(url) || !isAllowedNewsUrl(url, allowedHosts)) continue;
    const rawDate = tag(entry, ["pubDate", "published", "updated"]);
    const timestamp = rawDate ? Date.parse(plainText(rawDate)) : Number.NaN;
    const summary = plainText(tag(entry, ["description", "summary", "content:encoded", "content"]) ?? "");
    seen.add(url);
    items.push({
      title,
      url,
      publishedAt: Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString(),
      summary: summary ? summary.slice(0, 280) : null,
    });
    if (items.length >= limit) break;
  }
  return items;
}

export function socialSymbol(value: string | null): SymbolKey | null {
  return value === "AAPL" || value === "NVDA" || value === "TSLA" ? value : null;
}
