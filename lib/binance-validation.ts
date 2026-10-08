import type { BinanceErrorKind, BinanceIntegration } from "../data/binance-integration.ts";

type Asset = NonNullable<BinanceIntegration["tokenizedAsset"]>;
type Quote = NonNullable<BinanceIntegration["quote"]>;
type Market = NonNullable<BinanceIntegration["marketInfo"]>;

export type BinanceValidationResult =
  | { ok: true; asset: Asset; quote: Quote; marketInfo: Market }
  | { ok: false; kind: BinanceErrorKind; message: string; asset: Asset | null; marketInfo: Market | null };

export function validateBinancePayload(
  symbol: string,
  assetsPayload: unknown,
  quotePayload: unknown,
  exchangePayload: unknown,
): BinanceValidationResult {
  const assets = Array.isArray(assetsPayload) ? assetsPayload as Asset[] : [];
  const asset = assets.find((item) => item?.underlyingEquitySymbol === symbol) ?? null;
  const exchange = exchangePayload as { timezone?: string; symbols?: Market[] } | null;
  const rawMarket = (exchange?.symbols ?? []).find((item) => item?.symbol === symbol) ?? null;
  const marketInfo = rawMarket ? { ...rawMarket, timezone: exchange?.timezone ?? "UTC" } : null;

  if (!asset || !marketInfo) {
    return { ok: false, kind: "ASSET_NOT_FOUND", message: `${symbol} was not returned consistently by tokenized-assets and exchangeInfo.`, asset, marketInfo };
  }
  if (quotePayload === null || quotePayload === undefined || quotePayload === "") {
    return { ok: false, kind: "EMPTY_RESPONSE", message: `Binance returned no current quote for ${symbol}.`, asset, marketInfo };
  }
  const quote = quotePayload as Quote;
  const bid = Number(quote.bidPrice);
  const ask = Number(quote.askPrice);
  const validQuote = quote.symbol === symbol && Number.isFinite(bid) && Number.isFinite(ask) && bid > 0 && ask >= bid;
  const validMetadata = asset.multiplierValid === true && Boolean(asset.assetCode && asset.assetName && marketInfo.tradability);
  if (!validQuote || !validMetadata) {
    return { ok: false, kind: "PROVIDER_ERROR", message: `Binance returned incomplete or mismatched data for ${symbol}.`, asset, marketInfo };
  }
  return { ok: true, asset, quote, marketInfo };
}
