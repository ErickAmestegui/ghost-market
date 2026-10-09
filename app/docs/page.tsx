import Link from "next/link";

const DOCUMENTS = [
  ["readme", "README", "Purpose, setup, verification commands, statuses and current limitations."],
  ["architecture", "Architecture", "Trust boundaries, live evidence pipeline, quality gates and security model."],
  ["contracts", "Contracts & provenance", "BSC contract addresses, registries, infrastructure and audited markets."],
  ["technical-evidence", "Binance Web3 technical evidence", "Signed endpoints, observed responses and the unresolved provider restriction."],
];

export default function DocumentationIndex() {
  return <main className="docs-shell"><nav><Link href="/">← Ghost Market</Link></nav><header><span>GHOST MARKET · FOR JUDGES</span><h1>Technical documentation</h1><p>Readable HTML pages backed by the same versioned documents included in the repository.</p></header><section className="docs-index">{DOCUMENTS.map(([slug, title, description]) => <Link key={slug} href={`/docs/${slug}`}><span>DOCUMENT</span><h2>{title}</h2><p>{description}</p><b>Open →</b></Link>)}<article><span>PENDING · AUTHOR-OWNED</span><h2>Developer Experience Report</h2><p>The personal report is intentionally not generated or rewritten by Ghost Market. Publication remains pending the author&apos;s review and approval.</p></article></section></main>;
}
