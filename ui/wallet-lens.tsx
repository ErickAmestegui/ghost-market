"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CircleAlert, ExternalLink, LoaderCircle, Plug, Radar, RefreshCw, Search, ShieldCheck, Unplug } from "lucide-react";
import type { Locale } from "@/data/types";
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

export function WalletLens({ locale, onInvestigate }: { locale: Locale; onInvestigate: () => void }) {
  const providerRef = useRef<Provider | null>(null);
  const [wallet, setWallet] = useState<WalletState>(initialWallet);
  const [publicAddress, setPublicAddress] = useState("");
  const [publicState, setPublicState] = useState<"idle" | "loading" | "done">("idle");
  const [publicResult, setPublicResult] = useState<PublicResult | null>(null);

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

  </section>;
}

function LensFact({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
function LensBadge({ status }: { status: WalletState["status"] }) {
  const tone = status === "connected" ? "confirmed" : status === "wrong-network" || status === "provider-error" || status === "rejected" ? "warning" : status === "connecting" ? "loading" : "muted";
  return <span className={`lens-badge ${tone}`}>{status.replaceAll("-", " ").toUpperCase()}</span>;
}
