const BUILD_PREFIX = "/build";

export function encodeWeb3Query(entries: Array<[string, string]>) {
  return entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
}

export function buildWeb3RequestPath(path: string, entries: Array<[string, string]> = []) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const query = encodeWeb3Query(entries);
  return `${BUILD_PREFIX}${normalized}${query ? `?${query}` : ""}`;
}

export function buildWeb3PreHash(timestamp: string, method: string, requestPath: string, body = "") {
  return `${timestamp}${method.toUpperCase()}${requestPath}${body}`;
}

export async function signWeb3Request(secretKey: string, preHash: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secretKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(preHash));
  let binary = "";
  for (const byte of new Uint8Array(signature)) binary += String.fromCharCode(byte);
  return btoa(binary);
}
