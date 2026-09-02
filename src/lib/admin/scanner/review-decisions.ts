import type {
  ScannerApprovedCapabilityMapping,
  ScannerCapabilityReview,
  ScannerReviewDecision,
  ScannerReviewSession,
} from "./types";

/* =========================================================
   LYNUX SCANNER V1 — REVIEW DECISIONS

   Purpose:
   Apply explicit human review decisions to a review session.

   IMPORTANT:

   This layer does NOT:
   - run scans
   - auto-approve
   - enable capabilities
   - disable capabilities
   - enforce capabilities

   It only records manual decisions.
========================================================= */

function createReviewedState(
  capabilityKey: string,
  decision: Exclude<
    ScannerReviewDecision,
    "pending"
  >,
  note: string | null
): ScannerCapabilityReview {
  return {
    capabilityKey,

    decision,

    note,

    reviewedAt:
      new Date().toISOString(),
  };
}

/* =========================================================
   UPDATE ONE REVIEW ITEM

   Returns a new session object.

   Existing scanner proposal data remains unchanged.
========================================================= */

function setScannerReviewDecision(
  session: ScannerReviewSession,
  capabilityKey: string,
  decision: Exclude<
    ScannerReviewDecision,
    "pending"
  >,
  note: string | null = null
): ScannerReviewSession {
  let found = false;

  const items =
    session.items.map(
      (item) => {
        if (
          item.proposal.capabilityKey !==
          capabilityKey
        ) {
          return item;
        }

        found = true;

        return {
          ...item,

          review:
            createReviewedState(
              capabilityKey,
              decision,
              note
            ),
        };
      }
    );

  if (!found) {
    throw new Error(
      `Scanner review capability not found: ${capabilityKey}`
    );
  }

  return {
    ...session,

    items,
  };
}

/* =========================================================
   APPROVE

   Approval means:

   "This detected canonical capability is a valid mapping."

   It DOES NOT mean enabled.
========================================================= */

export function approveScannerCapability(
  session: ScannerReviewSession,
  capabilityKey: string,
  note: string | null = null
): ScannerReviewSession {
  return setScannerReviewDecision(
    session,
    capabilityKey,
    "approved",
    note
  );
}

/* =========================================================
   REJECT

   Rejection means:

   "Do not map this scanner proposal."

   It does NOT disable anything that may already exist in
   Admin Core.
========================================================= */

export function rejectScannerCapability(
  session: ScannerReviewSession,
  capabilityKey: string,
  note: string | null = null
): ScannerReviewSession {
  return setScannerReviewDecision(
    session,
    capabilityKey,
    "rejected",
    note
  );
}

/* =========================================================
   RESET TO PENDING

   Useful if a reviewer wants to reconsider a decision.

   Resetting review state does NOT alter any existing Admin
   Core capability state.
========================================================= */

export function resetScannerCapabilityReview(
  session: ScannerReviewSession,
  capabilityKey: string
): ScannerReviewSession {
  let found = false;

  const items =
    session.items.map(
      (item) => {
        if (
          item.proposal.capabilityKey !==
          capabilityKey
        ) {
          return item;
        }

        found = true;

        return {
          ...item,

          review: {
            capabilityKey,

            decision: "pending" as const,

            note: null,

            reviewedAt: null,
          },
        };
      }
    );

  if (!found) {
    throw new Error(
      `Scanner review capability not found: ${capabilityKey}`
    );
  }

  return {
    ...session,

    items,
  };
}

/* =========================================================
   EXTRACT APPROVED MAPPINGS

   This is the handoff boundary toward Admin Core.

   Only manually-approved review items are returned.

   IMPORTANT:

   These mappings still do NOT set enabled=true.
========================================================= */

export function getApprovedScannerMappings(
  session: ScannerReviewSession
): ScannerApprovedCapabilityMapping[] {
  return session.items
    .filter(
      (item) =>
        item.review.decision ===
        "approved"
    )
    .map(
      (item) => ({
        capabilityKey:
          item.proposal.capabilityKey,

        approved: true,

        approvedAt:
          item.review.reviewedAt ??
          new Date().toISOString(),

        confidence:
          item.proposal.confidence,

        confidenceScore:
          item.proposal.confidenceScore,

        discoveredNames:
          [...item.proposal.discoveredNames],

        actions:
          [...item.proposal.actions],
      })
    );
}