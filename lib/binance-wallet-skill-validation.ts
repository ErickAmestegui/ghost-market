export type WalletSkillListItem = {
  chainId?: string;
  contractAddress?: string;
  symbol?: string;
  ticker?: string;
  type?: number;
  multiplier?: string;
};

export function selectOndoBscAsset(items: WalletSkillListItem[], ticker: string) {
  return items.find((item) =>
    item.chainId === "56"
    && item.type === 1
    && item.ticker?.toUpperCase() === ticker.toUpperCase()
    && /^0x[0-9a-f]{40}$/i.test(item.contractAddress ?? "")
  ) ?? null;
}

export function normalizeOndoTokenPrice(tokenPrice: unknown, multiplier: unknown) {
  const price = Number(tokenPrice);
  const shares = Number(multiplier);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(shares) || shares <= 0) return null;
  return price / shares;
}

export function percentDifference(value: number, reference: unknown) {
  const base = Number(reference);
  if (!Number.isFinite(base) || base <= 0) return null;
  return (value - base) / base * 100;
}

export function isSuccessfulWalletSkillPayload(payload: { code?: unknown; success?: unknown }) {
  return payload.code === "000000" && payload.success === true;
}
