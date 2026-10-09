import architecture from "../../../docs/ARCHITECTURE.md?raw";
import contracts from "../../../docs/CONTRACTS.md?raw";
import report from "../../../docs/DEVELOPER_EXPERIENCE_REPORT.md?raw";

const DOCUMENTS: Record<string, string> = {
  "ARCHITECTURE.md": architecture,
  "CONTRACTS.md": contracts,
  "DEVELOPER_EXPERIENCE_REPORT.md": report,
};

export async function GET(_request: Request, context: { params: Promise<{ document: string }> }) {
  const { document } = await context.params;
  const content = DOCUMENTS[document];
  if (!content) return new Response("Not found", { status: 404 });
  return new Response(content, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}
