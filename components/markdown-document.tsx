import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <a key={index} href={link[2]} target={link[2].startsWith("http") ? "_blank" : undefined} rel={link[2].startsWith("http") ? "noreferrer" : undefined}>{link[1]}</a>;
    return part;
  });
}

function cells(line: string) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

export function MarkdownDocument({ source }: { source: string }) {
  const lines = source.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) code.push(lines[index++]);
      index += 1;
      blocks.push(<pre key={blocks.length} data-language={language}><code>{code.join("\n")}</code></pre>);
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const content = inline(heading[2]);
      blocks.push(level === 1 ? <h1 key={blocks.length}>{content}</h1> : level === 2 ? <h2 key={blocks.length}>{content}</h2> : level === 3 ? <h3 key={blocks.length}>{content}</h3> : <h4 key={blocks.length}>{content}</h4>);
      index += 1;
      continue;
    }
    if (line.includes("|") && /^\s*\|?\s*:?-+/.test(lines[index + 1] ?? "")) {
      const headers = cells(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) rows.push(cells(lines[index++]));
      blocks.push(<div className="doc-table-wrap" key={blocks.length}><table><thead><tr>{headers.map((cell, cellIndex) => <th key={cellIndex}>{inline(cell)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) items.push(lines[index++].replace(/^[-*]\s+/, ""));
      blocks.push(<ul key={blocks.length}>{items.map((item, itemIndex) => <li key={itemIndex}>{inline(item)}</li>)}</ul>);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) items.push(lines[index++].replace(/^\d+\.\s+/, ""));
      blocks.push(<ol key={blocks.length}>{items.map((item, itemIndex) => <li key={itemIndex}>{inline(item)}</li>)}</ol>);
      continue;
    }
    if (line.startsWith("> ")) {
      blocks.push(<blockquote key={blocks.length}>{inline(line.slice(2))}</blockquote>);
      index += 1;
      continue;
    }
    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,4})\s|^```|^[-*]\s+|^\d+\.\s+|^>\s/.test(lines[index]) && !(lines[index].includes("|") && /^\s*\|?\s*:?-+/.test(lines[index + 1] ?? ""))) paragraph.push(lines[index++].trim());
    blocks.push(<p key={blocks.length}>{inline(paragraph.join(" "))}</p>);
  }
  return <article className="markdown-document">{blocks}</article>;
}
