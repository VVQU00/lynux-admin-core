import {
  loadGithubScannerSource,
} from "../src/lib/admin/scanner/github-source";

import {
  scanSourceFiles,
} from "../src/lib/admin/scanner/scan-project";

async function main() {
  const siteId =
    process.argv[2];

  if (!siteId) {
    throw new Error(
      "Usage: npx tsx scripts/test-github-scanner.ts <site-id>"
    );
  }

  console.log("");
  console.log(
    "LYNUX GITHUB SCANNER TEST"
  );
  console.log(
    `Site: ${siteId}`
  );
  console.log("");

  const source =
    await loadGithubScannerSource(
      siteId
    );

  console.log(
    `Repository: ${source.projectRoot}`
  );

  console.log(
    `Files loaded: ${source.files.length}`
  );

  console.log(
    `Files ignored: ${source.ignoredFiles}`
  );

  console.log(
    `Source warnings: ${source.warnings.length}`
  );

  console.log("");

  const result =
    scanSourceFiles({
      projectRoot:
        source.projectRoot,

      projectName:
        source.projectName,

      files:
        source.files,

      filesIgnored:
        source.ignoredFiles,

      discoveryWarnings:
        source.warnings,
    });

  console.log(
    `Framework: ${result.project.framework}`
  );

  console.log(
    `Backends: ${result.project.backends.join(", ")}`
  );

  console.log(
    `Signals: ${result.project.signalsDetected}`
  );

  console.log(
    `Proposals: ${result.proposals.length}`
  );

  console.log("");

  for (
    const proposal of
    result.proposals
  ) {
    console.log(
      `${proposal.capabilityKey} / ${proposal.capabilityLabel} / ${proposal.confidence} (${proposal.confidenceScore})`
    );
  }

  console.log("");

  console.log(
    "Proposal-only test complete."
  );
}

main().catch(
  (error) => {
    console.error("");
    console.error(
      "LYNUX GitHub scanner test failed:"
    );

    console.error(error);

    process.exit(1);
  }
);