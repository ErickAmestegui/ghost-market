export const MIN_DEX_LIQUIDITY_USD = 1_000;
export const MAX_PRICE_IMPACT_PCT = 2;

export type DexQualityResult = {
  accepted: boolean;
  reason: string | null;
};

export function evaluateDexQuality(
  spotPriceUsd: number | null,
  liquidityUsd: number,
  priceImpactPct: number | null,
): DexQualityResult {
  if (spotPriceUsd === null || !Number.isFinite(spotPriceUsd) || spotPriceUsd <= 0) {
    return { accepted: false, reason: "INVALID OR EMPTY SPOT PRICE" };
  }

  if (!Number.isFinite(liquidityUsd) || liquidityUsd < MIN_DEX_LIQUIDITY_USD) {
    return {
      accepted: false,
      reason: `LIQUIDITY BELOW $${MIN_DEX_LIQUIDITY_USD.toLocaleString("en-US")} THRESHOLD ($${liquidityUsd.toFixed(2)})`,
    };
  }

  if (priceImpactPct === null || !Number.isFinite(priceImpactPct)) {
    return { accepted: false, reason: "PRICE IMPACT COULD NOT BE VERIFIED" };
  }

  if (priceImpactPct > MAX_PRICE_IMPACT_PCT) {
    return {
      accepted: false,
      reason: `PRICE IMPACT ABOVE ${MAX_PRICE_IMPACT_PCT}% THRESHOLD (${priceImpactPct.toFixed(2)}%)`,
    };
  }

  return { accepted: true, reason: null };
}
