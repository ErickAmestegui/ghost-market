import type { BinanceWeb3RwaErrorKind } from "@/data/binance-web3-rwa";

export function classifyWeb3RwaError(httpStatus: number, businessCode: number | null): BinanceWeb3RwaErrorKind {
  if (businessCode === 40101) return "INVALID_CREDENTIALS";
  if (businessCode === 40102) return "INVALID_SIGNATURE";
  if (businessCode === 40103) return "TIMESTAMP_REJECTED";
  if (businessCode === 40104 || httpStatus === 403) return "INSUFFICIENT_PERMISSION";
  if (businessCode === 42900 || httpStatus === 429) return "RATE_LIMITED";
  if (httpStatus === 404) return "ASSET_NOT_FOUND";
  return "PROVIDER_ERROR";
}
