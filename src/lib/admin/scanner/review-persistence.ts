import {
  createScannerReviewSession,
} from "./review-session";

import type {
  ScannerResult,
  ScannerReviewDecision,
  ScannerReviewSession,
} from "./types";

type SupabaseAdminClient = ReturnType<
  typeof import(
    "@/lib/admin/supabase/server"
  )["createSupabaseAdminClient"]
>;

type StoredReviewRow = {
  capability_key: string;
  decision: ScannerReviewDecision;
  note: string | null;
  reviewed_at: string | null;
};

type ScannerEvidenceRecord = {
  signalKind?: string;
};

type ScannerReviewSyncRow = {
  id: string;
  confidence: string;
  confidence_score: number;
  evidence: unknown;
};

/* =========================================================
   LYNUX SCANNER V1
   REVIEW PERSISTENCE

   CORE RULE:

   detected ≠ approved ≠ enabled

   Scanner persistence stores:
   - scanner runs
   - scanner proposals
   - manual review decisions

   It NEVER changes:

   site_capabilities.enabled
========================================================= */

/* =========================================================
   SAVE SCANNER RUN
========================================================= */

export async function saveScannerRun(
  supabase: SupabaseAdminClient,
  siteId: string,
  result: ScannerResult
) {
  const {
    data: scanRow,
    error: scanError,
  } = await supabase
    .from("scanner_runs")
    .insert({
      site_id:
        siteId,

      scanner_version:
        result.scannerVersion,

      project_name:
        result.project.projectName,

      project_root:
        result.project.projectRoot,

      framework:
        result.project.framework,

      backends:
        result.project.backends,

      scanned_at:
        result.project.scannedAt,

      files_examined:
        result.project.filesExamined,

      files_ignored:
        result.project.filesIgnored,

      signals_detected:
        result.project.signalsDetected,

      warnings:
        result.warnings,
    })
    .select("id")
    .single();

  if (
    scanError ||
    !scanRow
  ) {
    console.error(
      "LYNUX scanner run persistence failed:",
      scanError
    );

    throw new Error(
      "Unable to save LYNUX scanner run."
    );
  }

  /* =========================================================
     SAVE PROPOSALS

     Every proposal begins as pending.

     Detection never equals approval.
  ========================================================= */

  if (
    result.proposals.length >
    0
  ) {
    const rows =
      result.proposals.map(
        (proposal) => ({
          scan_id:
            scanRow.id,

          site_id:
            siteId,

          capability_key:
            proposal.capabilityKey,

          capability_label:
            proposal.capabilityLabel,

          confidence:
            proposal.confidence,

          confidence_score:
            proposal.confidenceScore,

          discovered_names:
            proposal.discoveredNames,

          actions:
            proposal.actions,

          evidence:
            proposal.evidence,

          decision:
            "pending",

          note:
            null,

          reviewed_at:
            null,
        })
      );

    const {
      error: proposalError,
    } = await supabase
      .from(
        "scanner_capability_reviews"
      )
      .insert(rows);

    if (proposalError) {
      console.error(
        "LYNUX scanner proposal persistence failed:",
        proposalError
      );

      /*
       * Delete the parent run if
       * proposal persistence fails.
       *
       * This prevents an incomplete
       * scanner run from becoming
       * the latest run.
       */
      await supabase
        .from("scanner_runs")
        .delete()
        .eq(
          "id",
          scanRow.id
        );

      throw new Error(
        "Unable to save LYNUX scanner capability proposals."
      );
    }
  }

  return scanRow.id;
}

/* =========================================================
   GET LATEST RUN
========================================================= */

export async function getLatestScannerRun(
  supabase: SupabaseAdminClient,
  siteId: string
) {
  const {
    data,
    error,
  } = await supabase
    .from("scanner_runs")
    .select(
      `
        id,
        site_id,
        scanner_version,
        project_root,
        scanned_at
      `
    )
    .eq(
      "site_id",
      siteId
    )
    .order(
      "scanned_at",
      {
        ascending: false,
      }
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "LYNUX scanner latest-run lookup failed:",
      error
    );

    throw new Error(
      "Unable to load latest LYNUX scanner run."
    );
  }

  return data;
}

/* =========================================================
   GET LATEST RUN ID
========================================================= */

export async function getLatestScannerRunId(
  supabase: SupabaseAdminClient,
  siteId: string
) {
  const run =
    await getLatestScannerRun(
      supabase,
      siteId
    );

  return (
    run?.id ??
    null
  );
}

/* =========================================================
   LOAD STORED REVIEWS
========================================================= */

async function loadStoredReviews(
  supabase: SupabaseAdminClient,
  scanId: string
) {
  const {
    data,
    error,
  } = await supabase
    .from(
      "scanner_capability_reviews"
    )
    .select(
      `
        capability_key,
        decision,
        note,
        reviewed_at
      `
    )
    .eq(
      "scan_id",
      scanId
    );

  if (error) {
    console.error(
      "LYNUX scanner review load failed:",
      error
    );

    throw new Error(
      "Unable to load LYNUX scanner reviews."
    );
  }

  return (
    data ??
    []
  ) as StoredReviewRow[];
}

/* =========================================================
   CHECK WHETHER SAVED RUN MATCHES CURRENT PROPOSALS

   For Scanner v1 we compare:

   - scanner version
   - project root
   - canonical capability keys

   If those change, a new scanner run is created.

   Existing approvals are NOT silently
   copied onto a different capability set.
========================================================= */

async function savedRunMatchesResult(
  supabase: SupabaseAdminClient,
  {
    scanId,
    scannerVersion,
    projectRoot,
    result,
  }: {
    scanId: string;
    scannerVersion: string;
    projectRoot: string;
    result: ScannerResult;
  }
) {
  if (
    scannerVersion !==
      result.scannerVersion ||
    projectRoot !==
      result.project.projectRoot
  ) {
    return false;
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "scanner_capability_reviews"
    )
    .select(
      "capability_key"
    )
    .eq(
      "scan_id",
      scanId
    );

  if (error) {
    console.error(
      "LYNUX scanner capability comparison failed:",
      error
    );

    throw new Error(
      "Unable to compare LYNUX scanner runs."
    );
  }

  const savedKeys =
    (data ?? [])
      .map(
        (row) =>
          row.capability_key
      )
      .sort();

  const currentKeys =
    result.proposals
      .map(
        (proposal) =>
          proposal.capabilityKey
      )
      .sort();

  if (
    savedKeys.length !==
    currentKeys.length
  ) {
    return false;
  }

  return savedKeys.every(
    (
      key,
      index
    ) =>
      key ===
      currentKeys[index]
  );
}

/* =========================================================
   APPLY DATABASE REVIEW STATE TO CURRENT SESSION
========================================================= */

function applyStoredReviews(
  session: ScannerReviewSession,
  storedReviews: StoredReviewRow[]
): ScannerReviewSession {
  const reviewMap =
    new Map(
      storedReviews.map(
        (row) => [
          row.capability_key,
          row,
        ]
      )
    );

  return {
    ...session,

    items:
      session.items.map(
        (item) => {
          const stored =
            reviewMap.get(
              item.proposal
                .capabilityKey
            );

          if (!stored) {
            return item;
          }

          return {
            ...item,

            review: {
              ...item.review,

              decision:
                stored.decision,

              note:
                stored.note,

              reviewedAt:
                stored.reviewed_at,
            },
          };
        }
      ),
  };
}

/* =========================================================
   GET OR CREATE REVIEW SESSION

   THIS IS THE MAIN SERVER-SIDE BRIDGE.

   FLOW:

   Current scan
      ↓
   Is there a compatible saved run?
      ↓
   YES → reuse it
      ↓
   Load saved review decisions
      ↓
   Apply them to current scanner proposals

   NO → save current scan once
      ↓
   Create pending review records
      ↓
   Return pending session
========================================================= */

export async function getOrCreateScannerReviewSession(
  supabase: SupabaseAdminClient,
  siteId: string,
  result: ScannerResult
): Promise<ScannerReviewSession> {
  const baseSession =
    createScannerReviewSession(
      result
    );

  const latestRun =
    await getLatestScannerRun(
      supabase,
      siteId
    );

  /* =========================================================
     FIRST SCAN FOR THIS SITE
  ========================================================= */

  if (!latestRun) {
    await saveScannerRun(
      supabase,
      siteId,
      result
    );

    return baseSession;
  }

  /* =========================================================
     VERIFY SAVED RUN IS STILL COMPATIBLE
  ========================================================= */

  const compatible =
    await savedRunMatchesResult(
      supabase,
      {
        scanId:
          latestRun.id,

        scannerVersion:
          latestRun.scanner_version,

        projectRoot:
          latestRun.project_root,

        result,
      }
    );

  /* =========================================================
     SOURCE / SCANNER CAPABILITIES CHANGED

     Save a new run.

     Do not inherit previous approvals automatically.
  ========================================================= */

  if (!compatible) {
    await saveScannerRun(
      supabase,
      siteId,
      result
    );

    return baseSession;
  }

  /* =========================================================
     REUSE SAVED RUN + SAVED REVIEW DECISIONS
  ========================================================= */

  const storedReviews =
    await loadStoredReviews(
      supabase,
      latestRun.id
    );

  return applyStoredReviews(
    baseSession,
    storedReviews
  );
}

/* =========================================================
   MAP SCANNER EVIDENCE TO ADMIN CORE DETECTION SOURCES

   Scanner evidence is more detailed than SiteCapability.
   This collapses raw scanner signal kinds into the existing
   universal Admin Core detected_from language.
========================================================= */

function buildDetectedFrom(
  evidence: unknown
): string[] {
  if (!Array.isArray(evidence)) {
    return [];
  }

  const detectedFrom =
    new Set<string>();

  for (const rawItem of evidence) {
    if (
      !rawItem ||
      typeof rawItem !== "object"
    ) {
      continue;
    }

    const item =
      rawItem as ScannerEvidenceRecord;

    switch (item.signalKind) {
      case "supabase-table":
      case "supabase-operation":
        detectedFrom.add(
          "database"
        );
        break;

      case "api-route":
      case "fetch-call":
      case "http-method":
        detectedFrom.add(
          "api"
        );
        break;

      case "route":
        detectedFrom.add(
          "route"
        );
        break;

      case "file-path":
      case "directory":
      case "function-name":
      case "identifier":
      case "import":
      case "keyword":
      case "server-action":
        detectedFrom.add(
          "component"
        );
        break;

      default:
        break;
    }
  }

  return [...detectedFrom];
}

/* =========================================================
   NORMALIZE CONFIDENCE SCORE FOR SITE_CAPABILITIES

   Scanner proposal scores are 0..1.
   site_capabilities.confidence_score is an integer.

   Store the universal Admin Core score as 0..100.
========================================================= */

function toCapabilityConfidenceScore(
  score: number
): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        score * 100
      )
    )
  );
}

/* =========================================================
   VERIFY CANONICAL CAPABILITY EXISTS

   site_capabilities.capability_key has a foreign key to
   capability_registry.key.

   Never attempt to bridge an unknown scanner key.
========================================================= */

async function assertCapabilityRegistered(
  supabase: SupabaseAdminClient,
  capabilityKey: string
) {
  const {
    data,
    error,
  } = await supabase
    .from(
      "capability_registry"
    )
    .select("key")
    .eq(
      "key",
      capabilityKey
    )
    .maybeSingle();

  if (error) {
    console.error(
      "LYNUX capability registry lookup failed:",
      error
    );

    throw new Error(
      "Unable to verify LYNUX capability registry."
    );
  }

  if (!data) {
    throw new Error(
      `Scanner capability "${capabilityKey}" is not registered in Admin Core.`
    );
  }
}

/* =========================================================
   SYNC REVIEW STATE TO SITE_CAPABILITIES

   CORE INVARIANT:

   detected ≠ approved ≠ enabled

   APPROVE:
     detected = true
     approved = true
     enabled = UNCHANGED

   REJECT / RESET:
     detected = true
     approved = false
     enabled = UNCHANGED

   Existing rows are updated WITHOUT writing enabled.
   New rows begin with enabled = false.
========================================================= */

async function syncScannerReviewToSiteCapability(
  supabase: SupabaseAdminClient,
  {
    siteId,
    capabilityKey,
    decision,
    confidence,
    confidenceScore,
    evidence,
    lastVerifiedAt,
  }: {
    siteId: string;
    capabilityKey: string;
    decision: ScannerReviewDecision;
    confidence: string;
    confidenceScore: number;
    evidence: unknown;
    lastVerifiedAt: string | null;
  }
) {
  await assertCapabilityRegistered(
    supabase,
    capabilityKey
  );

  const detectedFrom =
    buildDetectedFrom(
      evidence
    );

  const approved =
    decision === "approved";

  const now =
    new Date().toISOString();

  const {
    data: existing,
    error: existingError,
  } = await supabase
    .from(
      "site_capabilities"
    )
    .select(
      "site_id, capability_key, enabled"
    )
    .eq(
      "site_id",
      siteId
    )
    .eq(
      "capability_key",
      capabilityKey
    )
    .maybeSingle();

  if (existingError) {
    console.error(
      "LYNUX site capability lookup failed:",
      existingError
    );

    throw new Error(
      "Unable to load LYNUX site capability state."
    );
  }

  const sharedValues = {
    detected: true,
    approved,
    confidence,
    confidence_score:
      toCapabilityConfidenceScore(
        confidenceScore
      ),
    detected_from:
      detectedFrom,
    last_verified_at:
      lastVerifiedAt,
    updated_at:
      now,
  };

  if (existing) {
    const {
      error: updateError,
    } = await supabase
      .from(
        "site_capabilities"
      )
      .update(
        sharedValues
      )
      .eq(
        "site_id",
        siteId
      )
      .eq(
        "capability_key",
        capabilityKey
      );

    if (updateError) {
      console.error(
        "LYNUX site capability scanner sync failed:",
        updateError
      );

      throw new Error(
        "Unable to sync LYNUX scanner review to site capability."
      );
    }

    return;
  }

  const {
    error: insertError,
  } = await supabase
    .from(
      "site_capabilities"
    )
    .insert({
      site_id:
        siteId,
      capability_key:
        capabilityKey,
      ...sharedValues,

      /*
       * New capability rows are NEVER
       * enabled by scanner approval.
       */
      enabled:
        false,
    });

  if (insertError) {
    console.error(
      "LYNUX site capability scanner insert failed:",
      insertError
    );

    throw new Error(
      "Unable to create LYNUX scanner-backed site capability."
    );
  }
}

/* =========================================================
   UPDATE REVIEW DECISION

   Manual review is authoritative for approved state.

   This function also bridges the reviewed canonical mapping
   into site_capabilities while preserving enabled exactly.
========================================================= */

export async function updateScannerReviewDecision(
  supabase: SupabaseAdminClient,
  {
    siteId,
    capabilityKey,
    decision,
    note = null,
  }: {
    siteId: string;
    capabilityKey: string;
    decision:
      | "pending"
      | "approved"
      | "rejected";
    note?: string | null;
  }
) {
  const latestRun =
    await getLatestScannerRun(
      supabase,
      siteId
    );

  if (!latestRun) {
    throw new Error(
      "No scanner run exists for this site."
    );
  }

  const scanId =
    latestRun.id;

  /* =========================================================
     LOAD CURRENT REVIEW STATE

     Keep a copy so the review row can be restored if the
     site_capabilities bridge fails.
  ========================================================= */

  const {
    data: previousReview,
    error: previousReviewError,
  } = await supabase
    .from(
      "scanner_capability_reviews"
    )
    .select(
      `
        id,
        decision,
        note,
        reviewed_at,
        confidence,
        confidence_score,
        evidence
      `
    )
    .eq(
      "scan_id",
      scanId
    )
    .eq(
      "site_id",
      siteId
    )
    .eq(
      "capability_key",
      capabilityKey
    )
    .maybeSingle();

  if (previousReviewError) {
    console.error(
      "LYNUX scanner review lookup failed:",
      previousReviewError
    );

    throw new Error(
      "Unable to load LYNUX scanner review."
    );
  }

  if (!previousReview) {
    throw new Error(
      "Scanner capability review was not found."
    );
  }

  const reviewedAt =
    decision ===
    "pending"
      ? null
      : new Date()
          .toISOString();

  const updatedAt =
    new Date().toISOString();

  /* =========================================================
     SAVE REVIEW DECISION FIRST
  ========================================================= */

  const {
    data: updatedReview,
    error: reviewError,
  } = await supabase
    .from(
      "scanner_capability_reviews"
    )
    .update({
      decision,

      note:
        decision ===
        "pending"
          ? null
          : note,

      reviewed_at:
        reviewedAt,

      updated_at:
        updatedAt,
    })
    .eq(
      "scan_id",
      scanId
    )
    .eq(
      "site_id",
      siteId
    )
    .eq(
      "capability_key",
      capabilityKey
    )
    .select(
      `
        id,
        confidence,
        confidence_score,
        evidence
      `
    )
    .maybeSingle();

  if (reviewError) {
    console.error(
      "LYNUX scanner review update failed:",
      reviewError
    );

    throw new Error(
      "Unable to update LYNUX scanner review."
    );
  }

  if (!updatedReview) {
    throw new Error(
      "Scanner capability review was not found after update."
    );
  }

  /* =========================================================
     BRIDGE REVIEW TO SITE_CAPABILITIES
  ========================================================= */

  try {
    const syncRow =
      updatedReview as ScannerReviewSyncRow;

    await syncScannerReviewToSiteCapability(
      supabase,
      {
        siteId,
        capabilityKey,
        decision,
        confidence:
          syncRow.confidence,
        confidenceScore:
          syncRow.confidence_score,
        evidence:
          syncRow.evidence,
        lastVerifiedAt:
          latestRun.scanned_at ??
          null,
      }
    );
  } catch (syncError) {
    /* =======================================================
       COMPENSATING RESTORE

       Supabase client calls are not one SQL transaction here.
       If the bridge fails, restore the previous review state
       so the UI never claims a decision that failed to sync.
    ======================================================= */

    const {
      error: restoreError,
    } = await supabase
      .from(
        "scanner_capability_reviews"
      )
      .update({
        decision:
          previousReview.decision,
        note:
          previousReview.note,
        reviewed_at:
          previousReview.reviewed_at,
        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        previousReview.id
      );

    if (restoreError) {
      console.error(
        "LYNUX scanner review restore failed:",
        restoreError
      );
    }

    throw syncError;
  }
}
