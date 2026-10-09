import readme from "../../README.md?raw";

export async function GET() {
  return new Response(readme, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}
