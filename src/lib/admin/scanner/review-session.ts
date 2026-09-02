import type {
  ScannerCapabilityReview,
  ScannerResult,
  ScannerReviewItem,
  ScannerReviewSession,
  ScannerReviewSummary,
} from "./types";

/* =========================================================
   LYNUX SCANNER V1 — REVIEW SESSION

   Purpose:
   Convert immutable scanner discovery data into a separate
   manual-review structure.

   IMPORTANT:

   This layer does NOT:
   - approve automatically
   - reject automatically
   - enable capabilities
   - disable capabilities
   - enforce capabilities

   Every scanner proposal starts as pending.
========================================================= */

function createPendingReview(
  capabilityKey: string
): ScannerCapabilityReview {
  return {
    capabilityKey,

    decision: "pending",

    note: null,

    reviewedAt: null,
  };
}

/* =========================================================
   CREATE REVIEW ITEM
========================================================= */

function createReviewItem(
  proposal: ScannerResult["proposals"][number]
): ScannerReviewItem {
  return {
    proposal,

    review: createPendingReview(
      proposal.capabilityKey
    ),
  };
}

/* =========================================================
   CREATE REVIEW SESSION
========================================================= */

export function createScannerReviewSession(
  result: ScannerResult
): ScannerReviewSession {
  return {
    scannerVersion:
      result.scannerVersion,

    project:
      result.project,

    createdAt:
      new Date().toISOString(),

    items:
      result.proposals.map(
        createReviewItem
      ),

    warnings:
      result.warnings,
  };
}

/* =========================================================
   REVIEW SUMMARY
========================================================= */

export function getScannerReviewSummary(
  session: ScannerReviewSession
): ScannerReviewSummary {
  let pending = 0;
  let approved = 0;
  let rejected = 0;

  for (const item of session.items) {
    switch (item.review.decision) {
      case "approved":
        approved += 1;
        break;

      case "rejected":
        rejected += 1;
        break;

      case "pending":
      default:
        pending += 1;
        break;
    }
  }

  return {
    total:
      session.items.length,

    pending,

    approved,

    rejected,
  };
}