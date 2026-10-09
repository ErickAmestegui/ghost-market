import type { BinanceErrorKind } from "../data/binance-integration.ts";

export function classifyBinanceError(status: number, message = ""): BinanceErrorKind {
  if (status === 403 && /request blocked|cloudfront|waf/i.test(message)) return "PROVIDER_BLOCKED";
  if (status === 401 || status === 403 || /api.?key|credential|signature/i.test(message)) return "INVALID_CREDENTIALS";
  if (status === 418 || status === 429 || /rate.?limit|too many requests/i.test(message)) return "RATE_LIMITED";
  if (status === 408 || /timeout|timed out/i.test(message)) return "TIMEOUT";
  if (status === 404 || /unsupported|unknown symbol/i.test(message)) return "ASSET_NOT_FOUND";
  if (!message.trim()) return "EMPTY_RESPONSE";
  return "PROVIDER_ERROR";
}
