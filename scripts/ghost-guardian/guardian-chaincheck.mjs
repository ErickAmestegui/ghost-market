
const RPC = "https://bsc-dataseed.bnbchain.org";
const TOKEN = "0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4";

async function rpc(method, params) {
  const response = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params
    }),
    signal: AbortSignal.timeout(15000)
  });

  const body = await response.json();

  if (!response.ok || body.error || !body.result) {
    throw new Error(body.error?.message || "RPC unavailable");
  }

  return body.result;
}

async function main() {
  console.log("GHOST GUARDIAN — ON-CHAIN VERIFICATION");

  const chainId = Number(
    await rpc("eth_chainId", [])
  );

  const bytecode = await rpc(
    "eth_getCode",
    [TOKEN, "latest"]
  );

  const raw = await rpc("eth_call", [
    { to: TOKEN, data: "0x95d89b41" },
    "latest"
  ]);

  // Decode ERC-20 symbol() ABI string.
  const hex = raw.slice(2);
  const offset = Number(BigInt("0x" + hex.slice(0, 64)));
  const start = offset * 2;
  const length = Number(
    BigInt("0x" + hex.slice(start, start + 64))
  );

  if (length < 1 || length > 128) {
    throw new Error("Invalid token symbol");
  }

  const symbol = Buffer.from(
    hex.slice(start + 64, start + 64 + length * 2),
    "hex"
  ).toString("utf8");

  const passed =
    chainId === 56 &&
    bytecode !== "0x" &&
    symbol === "AAPLon";

  console.log("CHAIN ID:", chainId);
  console.log("CONTRACT CODE:", bytecode !== "0x" ? "PRESENT" : "MISSING");
  console.log("TOKEN SYMBOL:", symbol);
  console.log("ON-CHAIN CHECK:", passed ? "PASS" : "UNAVAILABLE");
  console.log("ACTION: NO TRADE");
}

main().catch(error => {
  console.log("ON-CHAIN CHECK: UNAVAILABLE");
  console.log("ERROR:", error.message);
  console.log("ACTION: NO TRADE");
});
