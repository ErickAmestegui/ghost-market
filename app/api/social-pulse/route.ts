import { NextRequest, NextResponse } from "next/server";
import { parseOfficialFeed, SOCIAL_ASSETS, socialSymbol } from "@/lib/social-pulse";

export async function GET(request: NextRequest) {
  const symbol = socialSymbol(request.nextUrl.searchParams.get("symbol")?.toUpperCase() ?? null);
  const observedAt = new Date().toISOString();
  const headers = { "cache-control": "public, max-age=180, stale-while-revalidate=900" };

  if (!symbol) {
    return NextResponse.json({ status: "UNAVAILABLE", observedAt, items: [], error: "Unsupported asset." }, { status: 400, headers });
  }

  const asset = SOCIAL_ASSETS[symbol];
  if (!asset.feedUrl) {
    return NextResponse.json({
      status: "UNAVAILABLE",
      symbol,
      provider: `${asset.company} official newsroom`,
      sourceUrl: asset.newsroom,
      feedUrl: null,
      observedAt,
      items: [],
      error: "No stable official feed is configured; use the attributed external newsroom.",
    }, { headers });
  }

  try {
    const response = await fetch(asset.feedUrl, {
      headers: { accept: "application/rss+xml, application/atom+xml, text/xml;q=0.9" },
      next: { revalidate: 180 },
    });
    if (!response.ok) throw new Error(`Official feed returned HTTP ${response.status}.`);
    const items = parseOfficialFeed(await response.text(), asset.allowedNewsHosts);
    if (!items.length) throw new Error("Official feed returned no attributable items.");
    return NextResponse.json({ status: "LIVE", symbol, provider: `${asset.company} official newsroom`, sourceUrl: asset.newsroom, feedUrl: asset.feedUrl, observedAt, items }, { headers });
  } catch (error) {
    return NextResponse.json({
      status: "UNAVAILABLE",
      symbol,
      provider: `${asset.company} official newsroom`,
      sourceUrl: asset.newsroom,
      feedUrl: asset.feedUrl,
      observedAt,
      items: [],
      error: error instanceof Error ? error.message : "Official feed is temporarily unavailable.",
    }, { headers });
  }
}
