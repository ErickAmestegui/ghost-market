
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

console.log("\n👻 GHOST GUARDIAN — COMPLETE INVESTIGATION");
console.log("==========================================");
console.log("Asset: AAPLon | Chain: BSC Mainnet (56)");
console.log("Mode: READ ONLY | Trading: DISABLED\n");

const steps = [
  {
    title: "1. BINANCE WALLET SKILLS + AGENTIC WALLET",
    file: "guardian-crosscheck.mjs",
    required: [
      "WALLET SKILL:",
      "AGENTIC WALLET:",
      "Difference:",
      "ACTION: NO TRADE"
    ],
    extract: [
      /Difference:\s*([^\r\n]+)/,
      /Price agreement:\s*([^\r\n]+)/
    ]
  },
  {
    title: "2. INDEPENDENT BSC CONTRACT CHECK",
    file: "guardian-chaincheck.mjs",
    required: [
      "CHAIN ID: 56",
      "ON-CHAIN CHECK: PASS"
    ],
    extract: [
      /TOKEN SYMBOL:\s*([^\r\n]+)/
    ]
  },
  {
    title: "3. PANCAKESWAP V2 RISK CHECK",
    file: "guardian-reserves.mjs",
    required: [
      "PAIR VERIFIED: YES",
      "V2 POOL DECISION:",
      "ACTION: NO TRADE"
    ],
    extract: [
      /DEVIATION VS POOL SPOT:\s*([^\r\n]+)/,
      /V2 POOL DECISION:\s*([^\r\n]+)/
    ]
  }
];

const report = [
  "GHOST GUARDIAN — TECHNICAL EVIDENCE",
  "Asset: AAPLon",
  "Network: BSC Mainnet (56)",
  "Run at: " + new Date().toISOString(),
  "Execution: READ ONLY",
  ""
];

let complete = true;

for (const step of steps) {
  console.log("\n" + step.title);
  console.log("-".repeat(42));

  const result = spawnSync(
    process.execPath,
    [step.file],
    {
      encoding: "utf8",
      windowsHide: true,
      timeout: 90000,
      maxBuffer: 1024 * 1024
    }
  );

  const output = result.stdout ?? "";

  const valid =
    result.status === 0 &&
    step.required.every(s => output.includes(s));

  report.push(step.title);

  if (!valid) {
    complete = false;
    console.log("STATUS: UNAVAILABLE");
    console.log("No se pudo completar esta verificación.");
    report.push("STATUS: UNAVAILABLE");
    report.push("");
    continue;
  }

  console.log("STATUS: VERIFIED");
  report.push("STATUS: VERIFIED");

  for (const pattern of step.extract) {
    const match = output.match(pattern);

    if (match) {
      console.log("EVIDENCE:", match[0]);
      report.push(match[0]);
    }
  }

  report.push("");
}

console.log("\n==========================================");
console.log("GHOST GUARDIAN — FINAL REPORT");
console.log("==========================================");

if (complete) {
  console.log("All three research stages completed.");
  console.log("The individual findings are recorded.");
} else {
  console.log("INCOMPLETE EVIDENCE");
  console.log("One or more checks were unavailable.");
}

console.log("\nIMPORTANT LIMITATIONS:");
console.log("- Binance quote routing is not verified.");
console.log("- Other DEX pools are not fully evaluated.");
console.log("- Price freshness and gas are not verified.");
console.log("- This is rule-based analysis, not an autonomous AI agent.");

console.log("\nFINAL ACTION: NO TRADE");
console.log("TRANSACTIONS EXECUTED BY THIS SCRIPT: 0");

report.push(
  "Overall research: " +
  (complete ? "COMPLETED" : "INCOMPLETE"),
  "Not proof that any trade is safe.",
  "No transaction commands executed by this script.",
  "Final action: NO TRADE"
);

writeFileSync(
  "ghost-guardian-final-evidence.txt",
  report.join("\n"),
  "utf8"
);

console.log("\nEvidence saved:");
console.log("ghost-guardian-final-evidence.txt");
