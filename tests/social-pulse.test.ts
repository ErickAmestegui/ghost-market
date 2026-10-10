import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedNewsUrl, parseOfficialFeed, socialSymbol } from "../lib/social-pulse.ts";

test("parses only attributable official newsroom items", () => {
  const feed = `<?xml version="1.0"?><rss><channel>
    <item><title><![CDATA[Official &amp; verified update]]></title><link>https://www.apple.com/newsroom/2026/10/update/</link><pubDate>Thu, 08 Oct 2026 12:00:00 GMT</pubDate><description><![CDATA[<p>Issuer supplied context.</p>]]></description></item>
    <item><title>Injected claim</title><link>https://example.com/fake</link></item>
  </channel></rss>`;
  const items = parseOfficialFeed(feed, ["apple.com", "www.apple.com"]);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Official & verified update");
  assert.equal(items[0].summary, "Issuer supplied context.");
  assert.equal(items[0].publishedAt, "2026-10-08T12:00:00.000Z");
});

test("rejects insecure, malformed and unrelated news links", () => {
  assert.equal(isAllowedNewsUrl("https://nvidianews.nvidia.com/post", ["nvidianews.nvidia.com"]), true);
  assert.equal(isAllowedNewsUrl("http://nvidianews.nvidia.com/post", ["nvidianews.nvidia.com"]), false);
  assert.equal(isAllowedNewsUrl("https://nvidianews.nvidia.com.evil.test/post", ["nvidianews.nvidia.com"]), false);
  assert.equal(isAllowedNewsUrl("bad-url", ["nvidianews.nvidia.com"]), false);
});

test("accepts only supported social symbols", () => {
  assert.equal(socialSymbol("AAPL"), "AAPL");
  assert.equal(socialSymbol("MSFT"), null);
  assert.equal(socialSymbol(null), null);
});
