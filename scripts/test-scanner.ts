import path from "node:path";

import { scanProject } from "../src/lib/admin/scanner/scan-project";

/* =========================================================
   LYNUX SCANNER V1 — TEST RUNNER

   Usage:

   npx tsx scripts/test-scanner.ts "C:\\path\\to\\project"

   Example:

   npx tsx scripts/test-scanner.ts "C:\\Users\\Grimmy\\bluus-isle"
========================================================= */

function printDivider(): void {
  console.log(
    "\n============================================================\n"
  );
}

async function main(): Promise<void> {
  const projectArg = process.argv[2];

  if (!projectArg) {
    console.error(
      [
        "Missing project path.",
        "",
        "Usage:",
        'npx tsx scripts/test-scanner.ts "C:\\path\\to\\project"',
      ].join("\n")
    );

    process.exitCode = 1;
    return;
  }

  const projectRoot = path.resolve(projectArg);

  console.log("\nLYNUX SCANNER V1");
  console.log(`Scanning: ${projectRoot}`);

  const result = await scanProject(projectRoot);

  printDivider();

  console.log("PROJECT");
  console.log(`Name:              ${result.project.projectName}`);
  console.log(`Framework:         ${result.project.framework}`);
  console.log(`Backends:          ${result.project.backends.join(", ")}`);
  console.log(`Files examined:    ${result.project.filesExamined}`);
  console.log(`Files ignored:     ${result.project.filesIgnored}`);
  console.log(`Signals detected:  ${result.project.signalsDetected}`);
  console.log(`Scanned at:        ${result.project.scannedAt}`);

  printDivider();

  console.log(`PROPOSALS (${result.proposals.length})`);

  if (!result.proposals.length) {
    console.log("No canonical capability proposals detected.");
  }

  for (const proposal of result.proposals) {
    console.log("");
    console.log(
      `${proposal.capabilityKey} / ${proposal.capabilityLabel}`
    );

    console.log(
      `Confidence: ${proposal.confidence} (${proposal.confidenceScore})`
    );

    console.log(
      `Status:     ${proposal.status}`
    );

    if (proposal.discoveredNames.length) {
      console.log("Discovered names:");

      for (const name of proposal.discoveredNames) {
        console.log(`  - ${name}`);
      }
    }

    if (proposal.actions.length) {
      console.log("Actions:");

      for (const action of proposal.actions) {
        console.log(
          `  - ${action.action} / ${action.confidence} (${action.confidenceScore})`
        );
      }
    }

    console.log("Evidence:");

    for (const evidence of proposal.evidence.slice(0, 12)) {
      const location =
        evidence.line === null
          ? evidence.filePath
          : `${evidence.filePath}:${evidence.line}`;

      console.log(
        `  - [${evidence.signalKind}] ${evidence.value}`
      );

      console.log(
        `    ${location} / weight ${evidence.weight}`
      );
    }

    if (proposal.evidence.length > 12) {
      console.log(
        `  ... ${proposal.evidence.length - 12} more evidence records`
      );
    }
  }

  printDivider();

  console.log(`WARNINGS (${result.warnings.length})`);

  if (!result.warnings.length) {
    console.log("No scanner warnings.");
  }

  for (const warning of result.warnings) {
    console.log(
      `- [${warning.code}] ${warning.message}`
    );

    if (warning.filePath) {
      console.log(
        `  ${warning.filePath}`
      );
    }
  }

  printDivider();

  console.log("RAW SIGNAL SUMMARY");

  const summary = new Map<string, number>();

  for (const signal of result.signals) {
    summary.set(
      signal.kind,
      (summary.get(signal.kind) ?? 0) + 1
    );
  }

  for (const [kind, count] of [...summary.entries()].sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(
      `${kind.padEnd(22)} ${count}`
    );
  }

  printDivider();

  console.log(
    "Scanner completed in proposal-only mode. No Admin Core capabilities were approved, enabled, disabled, or enforced."
  );
}

main().catch((error) => {
  console.error("\nScanner failed.\n");
  console.error(error);

  process.exitCode = 1;
});