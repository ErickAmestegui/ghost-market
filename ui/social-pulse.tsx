"use client";

import { useEffect, useState } from "react";
import { Blocks, ExternalLink, Link2, LoaderCircle, Newspaper, Radar, RadioTower, RefreshCw, Rss, ShieldCheck, Sparkles } from "lucide-react";
import type { Locale, SymbolKey } from "@/data/types";
import { SOCIAL_ASSETS, type SocialNewsItem } from "@/lib/social-pulse";

type DisplayMode = "simple" | "pro";
type PulseResponse = {
  status: "LIVE" | "UNAVAILABLE";
  symbol: SymbolKey;
  provider: string;
  sourceUrl: string;
  feedUrl: string | null;
  observedAt: string;
  items: SocialNewsItem[];
  error?: string;
};

const tx = (locale: Locale, en: string, es: string) => locale === "en" ? en : es;
const when = (value: string | null | undefined, locale: Locale) => value ? new Date(value).toLocaleString(locale === "en" ? "en-US" : "es-BO", { dateStyle: "medium", timeStyle: "short" }) : "—";

export function SocialPulse({ locale, symbol, displayMode, onSymbol, onInvestigate }: { locale: Locale; symbol: SymbolKey; displayMode: DisplayMode; onSymbol: (symbol: SymbolKey) => void; onInvestigate: () => void }) {
  const asset = SOCIAL_ASSETS[symbol];
  const [response, setResponse] = useState<PulseResponse | null>(null);
  const [lastExternalAt, setLastExternalAt] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/social-pulse?symbol=${symbol}`, { signal: controller.signal })
      .then(async (result) => {
        const body = await result.json() as PulseResponse;
        if (!result.ok && !body.status) throw new Error("Official source request failed.");
        return body;
      })
      .then(setResponse)
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResponse({ status: "UNAVAILABLE", symbol, provider: `${asset.company} official newsroom`, sourceUrl: asset.newsroom, feedUrl: asset.feedUrl, observedAt: new Date().toISOString(), items: [], error: "Official source is temporarily unavailable." });
      })
    return () => controller.abort();
  }, [asset.company, asset.feedUrl, asset.newsroom, symbol]);

  const currentResponse = response?.symbol === symbol ? response : null;
  const loading = currentResponse === null;
  const news = currentResponse?.items.slice(0, displayMode === "pro" ? 6 : 3) ?? [];
  const sourceLinks = [
    { label: "xStocks", detail: tx(locale, "Issuer/deployment documentation", "Documentación del emisor y despliegue"), href: "https://docs.xstocks.fi/developers", kind: "ISSUER" },
    { label: "BscScan", detail: `${asset.token} · BNB Chain · ${asset.contract.slice(0, 8)}…${asset.contract.slice(-6)}`, href: `https://bscscan.com/token/${asset.contract}`, kind: "EXPLORER" },
    { label: "BNB Chain RPC", detail: tx(locale, "Public network documentation", "Documentación pública de red"), href: "https://docs.bnbchain.org/bnb-smart-chain/developers/json_rpc/json-rpc-endpoint/", kind: "NETWORK" },
    { label: "Binance Stocks", detail: tx(locale, "Official market-data documentation", "Documentación oficial de datos de mercado"), href: "https://developers.binance.com/en/docs/catalog/advanced-trading-stocks-trading/api/rest-api/market-data", kind: "MARKET" },
    { label: "Ondo", detail: tx(locale, "Separate tokenized-security issuer", "Emisor separado de valores tokenizados"), href: "https://docs.ondo.finance", kind: "ISSUER" },
  ];
  const markExternal = () => setLastExternalAt(new Date().toISOString());

  return <section className="page-shell pulse-page">
    <div className="pulse-hero">
      <div><p className="eyebrow">GHOST SOCIAL PULSE 2.0</p><h1>{tx(locale, "Beyond Prices. Understand the Signals.", "Más allá del precio. Entendé las señales.")}</h1><p>{tx(locale, "Official issuer news, verified source paths and clearly limited social context—without sentiment theater.", "Noticias oficiales del emisor, rutas de fuente verificables y contexto social con límites claros, sin teatro de sentimiento.")}</p><div className="pulse-safety"><ShieldCheck />{tx(locale, "Context only · never changes Ghost Score · never replaces market evidence", "Solo contexto · nunca cambia Ghost Score · nunca reemplaza evidencia de mercado")}</div></div>
      <div className="pulse-orbit" aria-hidden="true"><Radar /><i /><i /><i /><span>{asset.token}</span></div>
    </div>

    <div className="pulse-assets">{(Object.keys(SOCIAL_ASSETS) as SymbolKey[]).map((key) => <button key={key} className={key === symbol ? "active" : ""} onClick={() => onSymbol(key)}><b>{SOCIAL_ASSETS[key].company}</b><span>{SOCIAL_ASSETS[key].token}</span><small>{key}</small></button>)}</div>

    <div className="pulse-dashboard">
      <section className="pulse-news-panel">
        <header><div><span><Newspaper />{tx(locale, "OFFICIAL NEWS", "NOTICIAS OFICIALES")}</span><h2>{asset.company} Newsroom</h2></div><PulseBadge status={loading ? "LOADING" : currentResponse?.status ?? "UNAVAILABLE"} /></header>
        {loading && <div className="pulse-loading"><LoaderCircle className="spin" />{tx(locale, "Reading the official source…", "Leyendo la fuente oficial…")}</div>}
        {!loading && news.length > 0 && <div className="news-stack">{news.map((item) => <article key={item.url}><div><time>{when(item.publishedAt, locale)}</time><span>{tx(locale, "ISSUER SOURCE", "FUENTE DEL EMISOR")}</span></div><h3>{item.title}</h3>{item.summary && <p>{item.summary}</p>}<a href={item.url} target="_blank" rel="noreferrer" onClick={markExternal}>{tx(locale, "Read at source", "Leer en la fuente")}<ExternalLink /></a></article>)}</div>}
        {!loading && !news.length && <div className="pulse-unavailable"><Rss /><div><h3>{tx(locale, "Native feed unavailable", "Feed nativo no disponible")}</h3><p>{tx(locale, "Ghost found no stable, attributable feed for this issuer. The official newsroom remains available externally.", "Ghost no encontró un feed estable y atribuible para este emisor. La sala de prensa oficial sigue disponible externamente.")}</p>{currentResponse?.error && displayMode === "pro" && <small>{currentResponse.error}</small>}</div></div>}
        <footer><a href={asset.newsroom} target="_blank" rel="noreferrer" onClick={markExternal}>{tx(locale, "Open official newsroom", "Abrir sala de prensa oficial")}<ExternalLink /></a><span>{tx(locale, "Ghost receipt", "Recepción de Ghost")}: {when(currentResponse?.observedAt, locale)}</span></footer>
      </section>

      <aside className="pulse-side-stack">
        <article className="social-source-card"><header><span><RadioTower />X / SOCIAL</span><PulseBadge status="UNAVAILABLE" /></header><div className="official-account"><i>{asset.company.slice(0, 1)}</i><div><b>{asset.company}</b><span>{asset.xHandle} · {tx(locale, "official account", "cuenta oficial")}</span></div></div><h3>{tx(locale, "No posts embedded", "Sin publicaciones insertadas")}</h3><p>{tx(locale, "A stable authorized post feed is not available in this deployment. Ghost shows no copied posts, engagement counts or inferred sentiment.", "Este despliegue no dispone de un feed estable y autorizado. Ghost no muestra posts copiados, métricas de interacción ni sentimiento inferido.")}</p><a href={asset.xUrl} target="_blank" rel="noreferrer" onClick={markExternal}>{tx(locale, "Open official account", "Abrir cuenta oficial")}<ExternalLink /></a></article>

        <article className="ghost-context-card"><header><span><Sparkles />GHOST CONTEXT</span><PulseBadge status={news.length ? "CONFIRMED" : "UNAVAILABLE"} /></header><h3>{tx(locale, "What Ghost can safely say", "Lo que Ghost puede afirmar con seguridad")}</h3><p>{news.length ? tx(locale, `${news.length} timestamped item${news.length === 1 ? "" : "s"} came from ${asset.company}'s official source. They are issuer context, not independent market confirmation.`, `${news.length} noticia${news.length === 1 ? "" : "s"} con fecha proviene${news.length === 1 ? "" : "n"} de la fuente oficial de ${asset.company}. Es contexto del emisor, no confirmación independiente del mercado.`) : tx(locale, "No native issuer-news items were accepted. Ghost makes no inference from the absence of a feed.", "No se aceptaron noticias nativas del emisor. Ghost no infiere nada por la ausencia de un feed.")}</p><dl><div><dt>{tx(locale, "Score impact", "Impacto en score")}</dt><dd>NONE</dd></div><div><dt>{tx(locale, "Selected asset", "Activo seleccionado")}</dt><dd>{asset.token}</dd></div><div><dt>{tx(locale, "External check", "Consulta externa")}</dt><dd>{when(lastExternalAt, locale)}</dd></div></dl></article>
      </aside>
    </div>

    <section className="blockchain-radar"><header><div><span><Blocks />{tx(locale, "BLOCKCHAIN SOURCE PANEL", "PANEL DE FUENTES BLOCKCHAIN")}</span><h2>{tx(locale, "Follow every claim back to its source.", "Seguí cada afirmación hasta su fuente.")}</h2></div><PulseBadge status="CONFIRMED" /></header><div>{sourceLinks.slice(0, displayMode === "pro" ? sourceLinks.length : 3).map((source) => <a key={source.label} href={source.href} target="_blank" rel="noreferrer" onClick={markExternal}><Link2 /><span><b>{source.label}</b><small>{source.detail}</small></span><em>{source.kind}</em><ExternalLink /></a>)}</div>{displayMode === "pro" && <p className="pulse-pro-note"><Rss />{tx(locale, "News feed endpoint", "Endpoint del feed de noticias")}: {currentResponse?.feedUrl ?? "UNAVAILABLE"}</p>}</section>

    <button className="risk-bridge pulse-risk-bridge" onClick={onInvestigate}><RefreshCw /><span><b>{tx(locale, "Cross-check in Live Evidence", "Contrastar en Evidencia en vivo")}</b><small>{tx(locale, "News and social context do not validate contract identity, liquidity or execution quality.", "Las noticias y el contexto social no validan identidad de contrato, liquidez ni calidad de ejecución.")}</small></span><ExternalLink /></button>
  </section>;
}

function PulseBadge({ status }: { status: "LIVE" | "LOADING" | "CONFIRMED" | "UNAVAILABLE" }) {
  return <span className={`pulse-badge pulse-${status.toLowerCase()}`}>{status}</span>;
}
