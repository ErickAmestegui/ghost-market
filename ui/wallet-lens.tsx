"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CircleAlert, ExternalLink, Link2, LoaderCircle, Plug, Radar, RefreshCw, Search, ShieldCheck, Unplug } from "lucide-react";
import type { Locale, SymbolKey } from "@/data/types";
import { BSC_CHAIN_ID, formatWeiToBnb, isBscAddress, parseChainId, shortAddress } from "@/lib/wallet-lens";

type Provider = {
  request: (input: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

type WalletState = {
  status: "idle" | "connecting" | "connected" | "wrong-network" | "no-wallet" | "rejected" | "no-accounts" | "provider-error" | "disconnected";
  address: string | null;
  chainId: number | null;
  balanceBnb: string | null;
  readAt: string | null;
  message: string | null;
};

type PublicResult = {
  status: "LIVE" | "ERROR";
  address?: string;
  network?: string;
  chainId?: number;
  balanceBnb?: string;
  source?: string;
  sourceUrl?: string;
  sourceBlockNumber?: number;
  sourceTimestamp?: string;
  readAt?: string;
  explorerUrl?: string;
  error?: string;
};

const initialWallet: WalletState = { status: "idle", address: null, chainId: null, balanceBnb: null, readAt: null, message: null };
const tx = (locale: Locale, en: string, es: string) => locale === "en" ? en : es;
const when = (value: string | null | undefined, locale: Locale) => value ? new Date(value).toLocaleString(locale === "en" ? "en-US" : "es-BO", { dateStyle: "medium", timeStyle: "medium" }) : "—";

const SOCIAL = {
  AAPL: { company: "Apple", token: "AAPLx", newsroom: "https://www.apple.com/newsroom/", x: "https://x.com/Apple", xSearch: "https://x.com/search?q=%24AAPL%20OR%20AAPLx&src=typed_query", contract: "0x9d275685dc284c8eb1c79f6aba7a63dc75ec890a" },
  NVDA: { company: "NVIDIA", token: "NVDAx", newsroom: "https://nvidianews.nvidia.com/", x: "https://x.com/nvidia", xSearch: "https://x.com/search?q=%24NVDA%20OR%20NVDAx&src=typed_query", contract: "0xc845b2894dbddd03858fd2d643b4ef725fe0849d" },
  TSLA: { company: "Tesla", token: "TSLAx", newsroom: "https://ir.tesla.com/", x: "https://x.com/Tesla", xSearch: "https://x.com/search?q=%24TSLA%20OR%20TSLAx&src=typed_query", contract: "0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0" },
} satisfies Record<SymbolKey, { company: string; token: string; newsroom: string; x: string; xSearch: string; contract: string }>;

export function WalletLens({ locale, symbol, onSymbol, onInvestigate }: { locale: Locale; symbol: SymbolKey; onSymbol: (symbol: SymbolKey) => void; onInvestigate: () => void }) {
  const providerRef = useRef<Provider | null>(null);
  const [wallet, setWallet] = useState<WalletState>(initialWallet);
  const [publicAddress, setPublicAddress] = useState("");
  const [publicState, setPublicState] = useState<"idle" | "loading" | "done">("idle");
  const [publicResult, setPublicResult] = useState<PublicResult | null>(null);
  const [consultedAt, setConsultedAt] = useState<string | null>(null);

  const readWallet = useCallback(async (provider: Provider, suppliedAddress?: string) => {
    try {
      const accounts = suppliedAddress ? [suppliedAddress] : await provider.request({ method: "eth_accounts" }) as string[];
      if (!accounts.length) {
        setWallet({ ...initialWallet, status: "no-accounts", message: tx(locale, "No authorized account was returned.", "La wallet no devolvió ninguna cuenta autorizada.") });
        return;
      }
      const chainHex = await provider.request({ method: "eth_chainId" }) as string;
      const chainId = parseChainId(chainHex);
      if (chainId !== BSC_CHAIN_ID) {
        setWallet({ status: "wrong-network", address: accounts[0], chainId, balanceBnb: null, readAt: new Date().toISOString(), message: tx(locale, "Select BNB Smart Chain Mainnet in your wallet. Ghost will never switch networks silently.", "Selecciona BNB Smart Chain Mainnet en tu wallet. Ghost nunca cambiará la red en silencio.") });
        return;
      }
      const balanceHex = await provider.request({ method: "eth_getBalance", params: [accounts[0], "latest"] }) as string;
      setWallet({ status: "connected", address: accounts[0], chainId, balanceBnb: formatWeiToBnb(balanceHex), readAt: new Date().toISOString(), message: null });
    } catch (error) {
      setWallet((current) => ({ ...current, status: "provider-error", balanceBnb: null, readAt: new Date().toISOString(), message: error instanceof Error ? error.message : tx(locale, "The wallet provider could not complete the read.", "El proveedor de la wallet no pudo completar la lectura.") }));
    }
  }, [locale]);

  useEffect(() => {
    const provider = (window as Window & { ethereum?: Provider }).ethereum;
    if (!provider) return;
    providerRef.current = provider;
    const onAccountsChanged = (...args: unknown[]) => {
      const accounts = Array.isArray(args[0]) ? args[0] as string[] : [];
      if (!accounts.length) setWallet({ ...initialWallet, status: "no-accounts", message: tx(locale, "Wallet access is no longer authorized.", "El acceso a la wallet ya no está autorizado.") });
      else void readWallet(provider, accounts[0]);
    };
    const onChainChanged = () => void readWallet(provider);
    const onDisconnect = () => setWallet({ ...initialWallet, status: "disconnected", message: tx(locale, "The wallet provider disconnected.", "El proveedor de la wallet se desconectó.") });
    provider.on?.("accountsChanged", onAccountsChanged);
    provider.on?.("chainChanged", onChainChanged);
    provider.on?.("disconnect", onDisconnect);
    return () => {
      provider.removeListener?.("accountsChanged", onAccountsChanged);
      provider.removeListener?.("chainChanged", onChainChanged);
      provider.removeListener?.("disconnect", onDisconnect);
      providerRef.current = null;
    };
  }, [locale, readWallet]);

  const connect = async () => {
    const provider = (window as Window & { ethereum?: Provider }).ethereum;
    if (!provider) {
      setWallet({ ...initialWallet, status: "no-wallet", message: tx(locale, "No EIP-1193 wallet was detected. Use the public-address investigation below.", "No se detectó una wallet EIP-1193. Usa la investigación por dirección pública.") });
      return;
    }
    providerRef.current = provider;
    setWallet({ ...initialWallet, status: "connecting" });
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
      if (!accounts.length) {
        setWallet({ ...initialWallet, status: "no-accounts", message: tx(locale, "The wallet returned no authorized accounts.", "La wallet no devolvió cuentas autorizadas.") });
        return;
      }
      await readWallet(provider, accounts[0]);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? Number((error as { code: unknown }).code) : null;
      setWallet({ ...initialWallet, status: code === 4001 ? "rejected" : "provider-error", message: code === 4001 ? tx(locale, "Connection request rejected. Nothing was signed or sent.", "Solicitud de conexión rechazada. No se firmó ni envió nada.") : error instanceof Error ? error.message : tx(locale, "Wallet connection failed.", "Falló la conexión de la wallet.") });
    }
  };

  const disconnect = () => {
    setWallet({ ...initialWallet, status: "disconnected", message: tx(locale, "Ghost Market cleared its local session. This does not necessarily revoke the extension permission.", "Ghost Market limpió su sesión local. Esto no necesariamente revoca el permiso de la extensión.") });
  };

  const investigateAddress = async () => {
    const address = publicAddress.trim();
    if (!isBscAddress(address)) {
      setPublicResult({ status: "ERROR", error: tx(locale, "Enter a valid 0x-prefixed BSC public address.", "Introduce una dirección pública BSC válida con prefijo 0x.") });
      setPublicState("done");
      return;
    }
    setPublicState("loading");
    setPublicResult(null);
    try {
      const response = await fetch("/api/wallet-balance", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address }) });
      setPublicResult(await response.json() as PublicResult);
    } catch {
      setPublicResult({ status: "ERROR", error: tx(locale, "The public BSC read is temporarily unavailable.", "La lectura pública de BSC no está disponible temporalmente.") });
    } finally {
      setPublicState("done");
    }
  };

  const walletMessage = wallet.status === "no-wallet" ? tx(locale, "No EIP-1193 wallet was detected. Use the public-address investigation below.", "No se detectó una wallet EIP-1193. Usa la investigación por dirección pública.")
    : wallet.status === "wrong-network" ? tx(locale, "Select BNB Smart Chain Mainnet in your wallet. Ghost will never switch networks silently.", "Selecciona BNB Smart Chain Mainnet en tu wallet. Ghost nunca cambiará la red en silencio.")
    : wallet.status === "rejected" ? tx(locale, "Connection request rejected. Nothing was signed or sent.", "Solicitud de conexión rechazada. No se firmó ni envió nada.")
    : wallet.status === "no-accounts" ? tx(locale, "No authorized account was returned.", "La wallet no devolvió ninguna cuenta autorizada.")
    : wallet.status === "disconnected" ? tx(locale, "Ghost Market cleared its local session. This does not necessarily revoke the extension permission.", "Ghost Market limpió su sesión local. Esto no necesariamente revoca el permiso de la extensión.")
    : wallet.message;

  return <section className="page-shell lens-page">
    <div className="section-hero lens-hero"><p className="eyebrow">GHOST WALLET LENS</p><h1>Connect. Verify. Investigate.</h1><p>{tx(locale, "A read-only BNB Chain lens. Connecting proves only that the wallet exposed a public account—it never proves a market is safe.", "Una lente de solo lectura para BNB Chain. Conectar solo demuestra que la wallet expuso una cuenta pública; nunca demuestra que un mercado sea seguro.")}</p><div className="read-only-strip"><ShieldCheck />{tx(locale, "No signatures · no transactions · no token approvals · no seed phrases", "Sin firmas · sin transacciones · sin aprobaciones de tokens · sin frases semilla")}</div></div>

    <div className="lens-grid">
      <article className="lens-card wallet-card"><header><div><span>EIP-1193 WALLET</span><h2>{tx(locale, "Voluntary connection", "Conexión voluntaria")}</h2></div><LensBadge status={wallet.status} /></header>
        <dl className="lens-facts"><LensFact label={tx(locale, "Address", "Dirección")} value={wallet.address ? shortAddress(wallet.address) : "—"} /><LensFact label={tx(locale, "Network", "Red")} value={wallet.chainId === 56 ? "BNB Smart Chain Mainnet" : wallet.chainId ? tx(locale, "Wrong network", "Red incorrecta") : "—"} /><LensFact label="Chain ID" value={wallet.chainId?.toString() ?? "—"} /><LensFact label="BNB" value={wallet.balanceBnb == null ? "—" : `${wallet.balanceBnb} BNB`} /><LensFact label={tx(locale, "Data source", "Fuente de datos")} value="EIP-1193 · eth_getBalance" /><LensFact label={tx(locale, "Ghost read time", "Hora de lectura de Ghost")} value={when(wallet.readAt, locale)} /></dl>
        {walletMessage && <p className={`lens-message ${wallet.status === "wrong-network" || wallet.status === "provider-error" ? "warning" : ""}`}><CircleAlert />{walletMessage}</p>}
        <div className="lens-actions"><button className="primary-action" onClick={connect} disabled={wallet.status === "connecting"}>{wallet.status === "connecting" ? <LoaderCircle className="spin" /> : <Plug />}{tx(locale, "Connect Wallet", "Conectar wallet")}</button><button className="secondary-action" onClick={() => providerRef.current && void readWallet(providerRef.current)} disabled={!providerRef.current || wallet.status === "connecting"}><RefreshCw />{tx(locale, "Refresh Balance", "Actualizar saldo")}</button><button className="quiet-action" onClick={disconnect}><Unplug />{tx(locale, "Disconnect from Ghost Market", "Desconectar de Ghost Market")}</button></div>
      </article>

      <article className="lens-card public-card"><header><div><span>PUBLIC ADDRESS FALLBACK</span><h2>{tx(locale, "Investigate without a wallet", "Investigar sin wallet")}</h2></div><LensBadge status={publicState === "loading" ? "connecting" : publicResult?.status === "LIVE" ? "connected" : publicResult?.status === "ERROR" ? "provider-error" : "idle"} /></header><p>{tx(locale, "Paste any BSC public address. This does not prove you own or control it, and Ghost does not save it.", "Pega cualquier dirección pública BSC. Esto no prueba que seas su propietario ni que la controles, y Ghost no la guarda.")}</p><div className="address-input"><input value={publicAddress} onChange={(event) => setPublicAddress(event.target.value)} placeholder="0x…" aria-label={tx(locale, "BSC public address", "Dirección pública BSC")} spellCheck={false} /><button onClick={investigateAddress} disabled={publicState === "loading"}>{publicState === "loading" ? <LoaderCircle className="spin" /> : <Search />}{tx(locale, "Investigate", "Investigar")}</button></div>
        {publicResult?.status === "LIVE" && <><dl className="lens-facts"><LensFact label={tx(locale, "Address", "Dirección")} value={shortAddress(publicResult.address!)} /><LensFact label={tx(locale, "Network", "Red")} value={publicResult.network ?? "—"} /><LensFact label="Chain ID" value={publicResult.chainId?.toString() ?? "—"} /><LensFact label="BNB" value={`${publicResult.balanceBnb ?? "—"} BNB`} /><LensFact label={tx(locale, "Source block time", "Hora del bloque de origen")} value={when(publicResult.sourceTimestamp, locale)} /><LensFact label={tx(locale, "Ghost read time", "Hora de lectura de Ghost")} value={when(publicResult.readAt, locale)} /></dl><div className="source-row"><span><ShieldCheck />{publicResult.source} · #{publicResult.sourceBlockNumber?.toLocaleString()}</span><a href={publicResult.explorerUrl} target="_blank" rel="noreferrer">BscScan <ExternalLink /></a></div></>}
        {publicResult?.status === "ERROR" && <p className="lens-message warning"><CircleAlert />{publicResult.error}</p>}
      </article>
    </div>

    <button className="risk-bridge" onClick={onInvestigate}><Radar /><span><b>{tx(locale, "Investigate Market Risk", "Investigar riesgo de mercado")}</b><small>{tx(locale, "Continue to contract identity, liquidity, execution risk and data-state evidence.", "Continúa con identidad de contrato, liquidez, riesgo de ejecución y estado de datos.")}</small></span><ExternalLink /></button>

    <SocialPulse locale={locale} symbol={symbol} onSymbol={onSymbol} consultedAt={consultedAt} onExternal={() => setConsultedAt(new Date().toISOString())} />
  </section>;
}

function SocialPulse({ locale, symbol, onSymbol, consultedAt, onExternal }: { locale: Locale; symbol: SymbolKey; onSymbol: (symbol: SymbolKey) => void; consultedAt: string | null; onExternal: () => void }) {
  const asset = SOCIAL[symbol];
  const links = [
    ["Binance Stocks", "https://developers.binance.com/en/docs/catalog/advanced-trading-stocks-trading/api/rest-api/market-data"],
    ["xStocks", "https://docs.xstocks.fi/developers"],
    ["Ondo", "https://docs.ondo.finance"],
    ["BscScan", `https://bscscan.com/token/${asset.contract}`],
    ["BNB Chain RPC", "https://docs.bnbchain.org/bnb-smart-chain/developers/json_rpc/json-rpc-endpoint/"],
  ];
  return <section className="social-pulse"><div className="pulse-heading"><div><p className="eyebrow">GHOST SOCIAL PULSE</p><h2>Beyond Prices. Understand the Signals.</h2><p>{tx(locale, "A source radar—not a sentiment score. Social activity never changes Ghost Score or replaces price evidence.", "Un radar de fuentes, no un score de sentimiento. La actividad social nunca cambia Ghost Score ni sustituye evidencia de precio.")}</p></div><Radar /></div><div className="pulse-assets">{(Object.keys(SOCIAL) as SymbolKey[]).map((key) => <button key={key} className={key === symbol ? "active" : ""} onClick={() => onSymbol(key)}><b>{SOCIAL[key].company}</b><span>{SOCIAL[key].token}</span></button>)}</div>
    <div className="radar-grid"><article><header><span>{tx(locale, "News and issuer information", "Noticias e información del emisor")}</span><TrustBadge status="CONFIRMED SOURCE" /></header><h3>{asset.company} · {asset.token}</h3><p>{tx(locale, "Ghost does not embed a live news feed without an authorized, timestamped provider. Open the official newsroom instead.", "Ghost no inserta noticias en vivo sin un proveedor autorizado y con timestamp. Abre la sala de prensa oficial.")}</p><a href={asset.newsroom} target="_blank" rel="noreferrer" onClick={onExternal}>{tx(locale, "Open official newsroom", "Abrir sala de prensa oficial")} <ExternalLink /></a><small>{tx(locale, "Embedded feed", "Feed integrado")}: <TrustBadge status="UNAVAILABLE" /> · {tx(locale, "Last external consultation", "Última consulta externa")}: {when(consultedAt, locale)}</small></article>
      <article><header><span>X / Twitter</span><TrustBadge status="UNAVAILABLE" /></header><h3>{tx(locale, "Authorized posts are not embedded", "No se insertan publicaciones sin autorización")}</h3><p>{tx(locale, "Use the official account or a clearly marked external search. Conversation volume is not credibility.", "Usa la cuenta oficial o una búsqueda externa claramente marcada. El volumen de conversación no equivale a credibilidad.")}</p><div className="pulse-links"><a href={asset.x} target="_blank" rel="noreferrer" onClick={onExternal}>{asset.company} on X <ExternalLink /></a><a href={asset.xSearch} target="_blank" rel="noreferrer" onClick={onExternal}>{tx(locale, "External X search", "Búsqueda externa en X")} <ExternalLink /></a></div><small><TrustBadge status="UNVERIFIED CLAIM" /> {tx(locale, "Applies to public posts not independently verified by Ghost.", "Aplica a publicaciones públicas no verificadas independientemente por Ghost.")}</small></article>
      <article className="source-radar"><header><span>{tx(locale, "Blockchain source radar", "Radar de fuentes blockchain")}</span><TrustBadge status="CONFIRMED SOURCE" /></header>{links.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer" onClick={onExternal}><Link2 /><span><b>{label}</b><small>{tx(locale, "Official documentation or public explorer", "Documentación oficial o explorador público")}</small></span><ExternalLink /></a>)}</article>
    </div><div className="trust-legend"><TrustBadge status="CONFIRMED SOURCE" /><TrustBadge status="UNVERIFIED CLAIM" /><TrustBadge status="HISTORICAL" /><TrustBadge status="UNAVAILABLE" /></div>
  </section>;
}

function LensFact({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
function LensBadge({ status }: { status: WalletState["status"] }) {
  const tone = status === "connected" ? "confirmed" : status === "wrong-network" || status === "provider-error" || status === "rejected" ? "warning" : status === "connecting" ? "loading" : "muted";
  return <span className={`lens-badge ${tone}`}>{status.replaceAll("-", " ").toUpperCase()}</span>;
}
function TrustBadge({ status }: { status: "CONFIRMED SOURCE" | "UNVERIFIED CLAIM" | "HISTORICAL" | "UNAVAILABLE" }) { return <span className={`trust-badge trust-${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>; }
