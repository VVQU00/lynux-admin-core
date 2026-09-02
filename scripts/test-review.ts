import { scanProject } from "../src/lib/admin/scanner/scan-project";
import {
  createScannerReviewSession,
  getScannerReviewSummary,
} from "../src/lib/admin/scanner/review-session";
import {
  approveScannerCapability,
  getApprovedScannerMappings,
  rejectScannerCapability,
} from "../src/lib/admin/scanner/review-decisions";

function printDivider() {
  console.log(
    "\n============================================================\n"
  );
}

function formatScore(score: number) {
  return score.toFixed(4);
}

function printProposalDetails(
  reviewSession: ReturnType<
    typeof createScannerReviewSession
  >
) {
  console.log("PROPOSALS");

  if (!reviewSession.items.length) {
    console.log("No proposals found.");
    return;
  }

  for (const item of reviewSession.items) {
    const proposal = item.proposal;
    const review = item.review;

    console.log("");
    console.log(
      `${proposal.capabilityKey} / ${proposal.capabilityLabel}`
    );
    console.log(
      `Confidence: ${proposal.confidence} (${formatScore(
        proposal.confidenceScore
      )})`
    );
    console.log(
      `Review:     ${review.decision}`
    );

    if (review.note) {
      console.log(`Note:       ${review.note}`);
    }

    if (proposal.actions.length) {
      console.log("Actions:");

      for (const action of proposal.actions) {
        console.log(
          `  - ${action.action} / ${action.confidence} (${formatScore(
            action.confidenceScore
          )})`
        );
      }
    }

    if (proposal.discoveredNames.length) {
      console.log("Discovered names:");

      for (
        const name
        of proposal.discoveredNames.slice(0, 8)
      ) {
        console.log(`  - ${name}`);
      }

      if (
        proposal.discoveredNames.length > 8
      ) {
        console.log(
          `  ... ${
            proposal.discoveredNames.length - 8
          } more`
        );
      }
    }

    if (proposal.evidence.length) {
      console.log("Top evidence:");

      const strongestEvidence =
        [...proposal.evidence]
          .sort(
            (a, b) =>
              b.weight - a.weight
          )
          .slice(0, 5);

      for (
        const evidence
        of strongestEvidence
      ) {
        const location =
          evidence.line === null
            ? evidence.filePath
            : `${evidence.filePath}:${evidence.line}`;

        console.log(
          `  - [${evidence.signalKind}] ${evidence.value}`
        );
        console.log(
          `    ${location} / weight ${formatScore(
            evidence.weight
          )}`
        );
      }

      if (
        proposal.evidence.length > 5
      ) {
        console.log(
          `  ... ${
            proposal.evidence.length - 5
          } more evidence records`
        );
      }
    }
  }
}

async function main() {
  const projectRoot =
    process.argv[2];

  if (!projectRoot) {
    console.error(
      "Usage: npx tsx scripts/test-review.ts <project-root>"
    );

    process.exit(1);
  }

  const scanResult =
    await scanProject(projectRoot);

  let reviewSession =
    createScannerReviewSession(
      scanResult
    );

  console.log(
    "\nLYNUX SCANNER REVIEW TEST"
  );
  console.log(
    `Project: ${scanResult.project.projectName}`
  );
  console.log(
    `Path:    ${projectRoot}`
  );
  console.log(
    `Scanner proposals: ${scanResult.proposals.length}`
  );
  console.log(
    `Warnings:          ${scanResult.warnings.length}`
  );

  printDivider();

  console.log("INITIAL SUMMARY");
  console.log(
    getScannerReviewSummary(
      reviewSession
    )
  );

  printDivider();

  printProposalDetails(
    reviewSession
  );

  const firstProposal =
    reviewSession.items[0];

  if (!firstProposal) {
    printDivider();

    console.log(
      "No proposals available to review."
    );

    return;
  }

  reviewSession =
    approveScannerCapability(
      reviewSession,
      firstProposal.proposal.capabilityKey,
      "Test approval"
    );

  const secondProposal =
    reviewSession.items[1];

  if (secondProposal) {
    reviewSession =
      rejectScannerCapability(
        reviewSession,
        secondProposal.proposal.capabilityKey,
        "Test rejection"
      );
  }

  printDivider();

  console.log(
    "AFTER REVIEW SUMMARY"
  );

  console.log(
    getScannerReviewSummary(
      reviewSession
    )
  );

  printDivider();

  console.log(
    "UPDATED REVIEW STATES"
  );

  for (
    const item
    of reviewSession.items
  ) {
    console.log(
      `- ${item.proposal.capabilityKey}: ${item.review.decision}`
    );
  }

  printDivider();

  console.log(
    "APPROVED MAPPINGS"
  );

  console.log(
    getApprovedScannerMappings(
      reviewSession
    ).map(
      (mapping) => ({
        capabilityKey:
          mapping.capabilityKey,

        confidence:
          mapping.confidence,

        confidenceScore:
          formatScore(
            mapping.confidenceScore
          ),

        actionCount:
          mapping.actions.length,

        discoveredNameCount:
          mapping.discoveredNames.length,
      })
    )
  );

  printDivider();

  console.log(
    "No capabilities were enabled or enforced."
  );
}

main().catch(
  (error) => {
    console.error(error);

    process.exit(1);
  }
);