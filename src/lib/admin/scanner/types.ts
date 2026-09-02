import type { CapabilityConfidence } from "../types";

/* =========================================================
   LYNUX SCANNER V1 — INTERNAL DISCOVERY TYPES

   IMPORTANT:
   Scanner detects and proposes.

   Scanner does NOT:
   - approve
   - reject
   - enable
   - disable
   - enforce

   Manual review is represented separately below.
========================================================= */

export type ScannerVersion = "1";

export type ScannerFramework =
  | "nextjs-app-router"
  | "nextjs-pages-router"
  | "nextjs-hybrid"
  | "unknown";

export type ScannerBackend =
  | "supabase"
  | "nextjs-api"
  | "server-actions"
  | "unknown";

/* =========================================================
   FILE DISCOVERY
========================================================= */

export type ScannerFileType =
  | "typescript"
  | "tsx"
  | "javascript"
  | "jsx"
  | "json"
  | "sql"
  | "unknown";

export type ScannerSourceFile = {
  absolutePath: string;

  relativePath: string;

  extension: string;

  fileType: ScannerFileType;

  size: number;

  content: string;
};

/* =========================================================
   RAW SIGNALS

   These are facts discovered directly from source code.

   They are NOT capability decisions.
========================================================= */

export type ScannerSignalKind =
  | "file-path"
  | "directory"
  | "route"
  | "api-route"
  | "http-method"
  | "supabase-table"
  | "supabase-operation"
  | "server-action"
  | "function-name"
  | "identifier"
  | "import"
  | "fetch-call"
  | "keyword";

export type ScannerSignal = {
  kind: ScannerSignalKind;

  value: string;

  filePath: string;

  line: number | null;

  context: string | null;
};

/* =========================================================
   CANONICAL LYNUX ACTION LANGUAGE

   Local websites may use different terminology.

   Example:

   removeProduct()
   delete_item()
   archiveListing()

   Scanner maps those local meanings toward canonical actions.
========================================================= */

export type CanonicalAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "publish"
  | "unpublish"
  | "approve"
  | "reject"
  | "archive"
  | "restore"
  | "upload"
  | "download"
  | "send"
  | "schedule"
  | "cancel"
  | "fulfill"
  | "refund"
  | "manage";

/* =========================================================
   EVIDENCE

   Evidence explains WHY Scanner proposed a mapping.
========================================================= */

export type ScannerEvidence = {
  signalKind: ScannerSignalKind;

  filePath: string;

  line: number | null;

  value: string;

  context: string | null;

  /*
   * Individual contribution to confidence.
   *
   * Expected range:
   *
   * 0.0 -> 1.0
   */
  weight: number;
};

/* =========================================================
   ACTION PROPOSALS

   Scanner may discover multiple actions beneath one
   canonical capability.

   These actions are evidence / discovery information.

   They do NOT independently grant permissions.
========================================================= */

export type ScannerActionProposal = {
  action: CanonicalAction;

  confidence: CapabilityConfidence;

  confidenceScore: number;

  evidence: ScannerEvidence[];
};

/* =========================================================
   CAPABILITY PROPOSALS

   capabilityKey MUST eventually resolve against the
   existing LYNUX feature registry.

   Local site terminology is stored separately so Admin Core
   never depends on each site's naming conventions.
========================================================= */

export type ScannerCapabilityProposal = {
  capabilityKey: string;

  capabilityLabel: string;

  /*
   * Names actually discovered inside the scanned project.
   *
   * Example:
   *
   * [
   *   "purchases",
   *   "checkout_records",
   *   "markFulfilled"
   * ]
   */
  discoveredNames: string[];

  actions: ScannerActionProposal[];

  confidence: CapabilityConfidence;

  confidenceScore: number;

  evidence: ScannerEvidence[];

  /*
   * Scanner proposals ALWAYS remain proposed.
   *
   * Manual approval never mutates this value.
   *
   * Approval exists in ScannerCapabilityReview instead.
   */
  status: "proposed";
};

/* =========================================================
   PROJECT METADATA
========================================================= */

export type ScannerProjectMetadata = {
  projectRoot: string;

  projectName: string;

  framework: ScannerFramework;

  backends: ScannerBackend[];

  scannedAt: string;

  filesExamined: number;

  filesIgnored: number;

  signalsDetected: number;
};

/* =========================================================
   SCAN WARNINGS

   Scanner warnings do not automatically make the site
   unhealthy or disable anything.
========================================================= */

export type ScannerWarningCode =
  | "unsupported-file"
  | "unreadable-file"
  | "ambiguous-capability"
  | "conflicting-capability"
  | "unknown-capability"
  | "scan-limit"
  | "parser-warning";

export type ScannerWarning = {
  code: ScannerWarningCode;

  message: string;

  filePath: string | null;
};

/* =========================================================
   COMPLETE SCAN RESULT

   This result is discovery data only.

   Flow:

   scan
      ↓
   proposals
      ↓
   manual review
      ↓
   approval
      ↓
   existing connector mapping
      ↓
   existing enforcement layer
========================================================= */

export type ScannerResult = {
  scannerVersion: ScannerVersion;

  project: ScannerProjectMetadata;

  signals: ScannerSignal[];

  proposals: ScannerCapabilityProposal[];

  warnings: ScannerWarning[];
};

/* =========================================================
   MANUAL REVIEW

   This layer is intentionally separate from ScannerResult.

   ScannerResult:
      "I detected this."

   ScannerCapabilityReview:
      "A human reviewed this detection."

   The proposal itself is NEVER rewritten to say approved.
========================================================= */

export type ScannerReviewDecision =
  | "pending"
  | "approved"
  | "rejected";

export type ScannerCapabilityReview = {
  /*
   * Canonical capability being reviewed.
   *
   * Must match ScannerCapabilityProposal.capabilityKey.
   */
  capabilityKey: string;

  /*
   * Manual decision only.
   *
   * pending:
   *   no human decision yet
   *
   * approved:
   *   mapping may move forward to Admin Core
   *
   * rejected:
   *   proposal is intentionally not mapped
   */
  decision: ScannerReviewDecision;

  /*
   * Optional human explanation.
   *
   * Useful for cases such as:
   *
   * "Customer fields exist only inside orders."
   *
   * "Navigation exists but is not administratively editable."
   */
  note: string | null;

  /*
   * Null until a human makes a decision.
   */
  reviewedAt: string | null;
};

/* =========================================================
   REVIEW ITEM

   Bundles immutable scanner discovery with the separate
   human review state.

   This is the shape the future Admin Core review UI can use.
========================================================= */

export type ScannerReviewItem = {
  proposal: ScannerCapabilityProposal;

  review: ScannerCapabilityReview;
};

/* =========================================================
   REVIEW SESSION

   Represents one scan being reviewed.

   IMPORTANT:

   A review session does not enable or disable capabilities.

   It only records human mapping decisions.
========================================================= */

export type ScannerReviewSession = {
  scannerVersion: ScannerVersion;

  project: ScannerProjectMetadata;

  createdAt: string;

  items: ScannerReviewItem[];

  warnings: ScannerWarning[];
};

/* =========================================================
   APPROVED MAPPING

   This is the safe handoff boundary between Scanner review
   and the existing Admin Core capability system.

   An approved mapping means:

   "Yes, this canonical capability exists on this site."

   It DOES NOT mean:

   "Turn this capability on."

   enabled remains controlled by the existing Admin Core
   capability/enforcement layer.
========================================================= */

export type ScannerApprovedCapabilityMapping = {
  capabilityKey: string;

  approved: true;

  approvedAt: string;

  /*
   * Preserve scanner confidence so Admin Core can explain
   * why the mapping originally existed.
   */
  confidence: CapabilityConfidence;

  confidenceScore: number;

  /*
   * Preserve local terminology for debugging / future
   * rescans without making Admin Core depend on it.
   */
  discoveredNames: string[];

  /*
   * Discovered actions remain informational metadata.
   *
   * They are NOT permission grants.
   */
  actions: ScannerActionProposal[];
};

/* =========================================================
   REVIEW HELPERS

   These types are intentionally small so future API/UI code
   can use the same contract without redefining decisions.
========================================================= */

export type ScannerReviewSummary = {
  total: number;

  pending: number;

  approved: number;

  rejected: number;
};