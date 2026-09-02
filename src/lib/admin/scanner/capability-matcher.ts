import {
  canonicalCapabilityLanguage,
  detectCanonicalActions,
  matchesCanonicalAlias,
  normalizeScannerTerm,
} from "./canonical-language";

import type {
  ScannerActionProposal,
  ScannerCapabilityProposal,
  ScannerEvidence,
  ScannerSignal,
} from "./types";

import type {
  CapabilityConfidence,
} from "../types";

/* =========================================================
   LYNUX SCANNER V1 — CAPABILITY MATCHER

   Purpose:
   Convert raw ScannerSignal facts into canonical LYNUX
   capability proposals.

   IMPORTANT:
   This layer proposes only.

   It NEVER:
   - approves
   - enables
   - disables
   - enforces

   Core rule:

   "This concept exists in source code"
   is NOT enough to create a capability proposal.

   A capability must have implementation evidence such as:

   - database table
   - API route
   - API fetch
   - admin/management route
   - admin/management directory
   - action-bearing implementation function

   Examples:

   customerName
      != Customers capability

   MobileBottomNav
      != Navigation management capability

   product_inventory
      = real persisted Inventory capability

   /api/admin/orders
      = real Orders implementation

   uploadProductImage
      = real Media upload implementation
========================================================= */

/* =========================================================
   SIGNAL WEIGHTS
========================================================= */

const SIGNAL_WEIGHTS: Record<
  ScannerSignal["kind"],
  number
> = {
  "supabase-table": 1,
  "api-route": 0.95,
  "route": 0.8,
  "function-name": 0.75,
  "identifier": 0.65,
  "fetch-call": 0.7,
  "server-action": 0.55,
  "http-method": 0.35,
  "supabase-operation": 0.45,
  "directory": 0.5,
  "file-path": 0.4,
  "import": 0.3,
  "keyword": 0.2,
};

/* =========================================================
   CONFIDENCE
========================================================= */

function getConfidence(
  score: number,
  hasConflict = false
): CapabilityConfidence {
  if (hasConflict) {
    return "conflict";
  }

  if (score >= 0.85) {
    return "verified";
  }

  if (score >= 0.65) {
    return "probable";
  }

  if (score >= 0.35) {
    return "possible";
  }

  return "unsupported";
}

/* =========================================================
   EVIDENCE
========================================================= */

function createEvidence(
  signal: ScannerSignal,
  weightMultiplier = 1
): ScannerEvidence {
  const baseWeight =
    SIGNAL_WEIGHTS[signal.kind] ?? 0.2;

  return {
    signalKind: signal.kind,

    filePath: signal.filePath,

    line: signal.line,

    value: signal.value,

    context: signal.context,

    weight: Math.min(
      1,
      baseWeight * weightMultiplier
    ),
  };
}

/* =========================================================
   CAPABILITY SEARCH VALUES

   Capability identity comes from the actual signal.

   Nearby source context must never manufacture a capability.
========================================================= */

function getSignalSearchValues(
  signal: ScannerSignal
): string[] {
  if (!signal.value) {
    return [];
  }

  return [signal.value];
}

/* =========================================================
   CAPABILITY MATCHING

   HTTP methods and Supabase operations describe ACTIONS,
   not capability identity.

   POST != Posts
   DELETE != some capability named Delete
========================================================= */

function signalMatchesCapability(
  signal: ScannerSignal,
  aliases: string[],
  strongSignals: string[]
): {
  matched: boolean;
  strong: boolean;
  matchedTerms: string[];
} {
  const matchedTerms =
    new Set<string>();

  let strong = false;

  if (
    signal.kind === "http-method" ||
    signal.kind === "supabase-operation" ||
    signal.kind === "server-action"
  ) {
    return {
      matched: false,
      strong: false,
      matchedTerms: [],
    };
  }

  for (
    const value
    of getSignalSearchValues(signal)
  ) {
    for (const alias of aliases) {
      if (
        matchesCanonicalAlias(
          value,
          alias
        )
      ) {
        matchedTerms.add(alias);
      }
    }

    for (
      const strongSignal
      of strongSignals
    ) {
      if (
        matchesCanonicalAlias(
          value,
          strongSignal
        )
      ) {
        matchedTerms.add(
          strongSignal
        );

        strong = true;
      }
    }
  }

  return {
    matched:
      matchedTerms.size > 0,

    strong,

    matchedTerms:
      [...matchedTerms],
  };
}

/* =========================================================
   SCORE AGGREGATION

   Diminishing returns:

   score =
   1 - product(1 - evidenceWeight)
========================================================= */

function aggregateEvidenceScore(
  evidence: ScannerEvidence[]
): number {
  if (!evidence.length) {
    return 0;
  }

  let remainder = 1;

  for (const item of evidence) {
    remainder *=
      1 - item.weight;
  }

  return Number(
    (1 - remainder).toFixed(4)
  );
}

/* =========================================================
   IMPLEMENTATION ANCHORS

   Scanner v1 must distinguish between:

   1. concept evidence
   2. implementation evidence

   Concept evidence:
   - customerName
   - eventLabel
   - MobileBottomNav
   - blogTitle

   Those may describe data/components but DO NOT prove
   a standalone manageable backend capability exists.

   Implementation evidence:
   - Supabase table
   - API route
   - API fetch
   - admin/management route
   - admin/management directory
   - action-bearing function

   At least one implementation anchor is required.
========================================================= */

function isManagementPath(
  value: string
): boolean {
  const normalized =
    value
      .replace(/\\/g, "/")
      .toLowerCase();

  return (
    normalized.includes("/admin/") ||
    normalized.startsWith("admin/") ||
    normalized.includes("/manage/") ||
    normalized.startsWith("manage/") ||
    normalized.includes("/management/") ||
    normalized.startsWith("management/") ||
    normalized.includes("/dashboard/") ||
    normalized.startsWith("dashboard/") ||
    normalized.includes("/editor/") ||
    normalized.startsWith("editor/")
  );
}

function isApiFetch(
  value: string
): boolean {
  const normalized =
    value
      .replace(/\\/g, "/")
      .toLowerCase();

  return (
    normalized.startsWith("/api/") ||
    normalized.includes("/api/")
  );
}

function signalContainsAllowedAction(
  signal: ScannerSignal,
  allowedActions: string[]
): boolean {
  const actions =
    detectCanonicalActions(
      signal.value
    );

  return actions.some(
    (action) =>
      allowedActions.includes(
        action
      )
  );
}

function hasImplementationAnchor(
  matchedSignals: ScannerSignal[],
  allowedActions: string[]
): boolean {
  for (
    const signal
    of matchedSignals
  ) {
    /*
     * A real persisted database entity is one of the
     * strongest possible capability anchors.
     */
    if (
      signal.kind ===
      "supabase-table"
    ) {
      return true;
    }

    /*
     * A Next.js API route proves backend implementation.
     */
    if (
      signal.kind ===
      "api-route"
    ) {
      return true;
    }

    /*
     * A frontend call to an API proves an operational
     * backend interaction exists.
     */
    if (
      signal.kind ===
        "fetch-call" &&
      isApiFetch(
        signal.value
      )
    ) {
      return true;
    }

    /*
     * Admin / management / dashboard / editor routes
     * represent an explicit management surface.
     *
     * A normal public route alone does not qualify.
     */
    if (
      signal.kind === "route" &&
      isManagementPath(
        signal.value
      )
    ) {
      return true;
    }

    /*
     * Same rule for directories.
     */
    if (
      signal.kind ===
        "directory" &&
      isManagementPath(
        signal.value
      )
    ) {
      return true;
    }

    /*
     * Functions may anchor a capability only when they
     * describe an actual canonical action supported by
     * that capability.
     *
     * Examples:
     *
     * uploadProductImage
     * deleteProduct
     * updateOrderStatus
     * saveInquiry
     *
     * But these DO NOT qualify:
     *
     * MobileBottomNav
     * customerName
     * CheckoutPage
     */
    if (
      signal.kind ===
        "function-name" &&
      signalContainsAllowedAction(
        signal,
        allowedActions
      )
    ) {
      return true;
    }
  }

  return false;
}

/* =========================================================
   EXPLICIT SUPABASE ACTIONS
========================================================= */

function getExplicitOperationActions(
  signal: ScannerSignal
): string[] {
  if (
    signal.kind !==
    "supabase-operation"
  ) {
    return [];
  }

  switch (
    normalizeScannerTerm(
      signal.value
    )
  ) {
    case "select":
      return ["read"];

    case "insert":
      return ["create"];

    case "update":
      return ["update"];

    case "delete":
      return ["delete"];

    case "upsert":
      return [
        "create",
        "update",
      ];

    default:
      return [];
  }
}

/* =========================================================
   HTTP ACTIONS
========================================================= */

function getHttpMethodActions(
  signal: ScannerSignal
): string[] {
  if (
    signal.kind !==
    "http-method"
  ) {
    return [];
  }

  switch (
    signal.value.toUpperCase()
  ) {
    case "GET":
      return ["read"];

    case "POST":
      return ["create"];

    case "PUT":
    case "PATCH":
      return ["update"];

    case "DELETE":
      return ["delete"];

    default:
      return [];
  }
}

/* =========================================================
   ACTION PROPOSALS
========================================================= */

function buildActionProposals(
  capabilitySignals: ScannerSignal[],
  allowedActions: string[]
): ScannerActionProposal[] {
  const actionEvidence =
    new Map<
      string,
      ScannerEvidence[]
    >();

  function addEvidence(
    action: string,
    signal: ScannerSignal,
    multiplier = 1
  ): void {
    if (
      !allowedActions.includes(
        action
      )
    ) {
      return;
    }

    const existing =
      actionEvidence.get(
        action
      ) ?? [];

    existing.push(
      createEvidence(
        signal,
        multiplier
      )
    );

    actionEvidence.set(
      action,
      existing
    );
  }

  for (
    const signal
    of capabilitySignals
  ) {
    /*
     * Local function/identifier names.

     * Example:
     * deleteProduct
     * updateOrder
     * uploadImage
     */
    for (
      const action
      of detectCanonicalActions(
        signal.value
      )
    ) {
      addEvidence(
        action,
        signal,
        0.9
      );
    }

    /*
     * Context can assist ACTION detection.

     * Unlike capability identity, an action may be supported
     * by nearby implementation language.
     */
    if (signal.context) {
      for (
        const action
        of detectCanonicalActions(
          signal.context
        )
      ) {
        addEvidence(
          action,
          signal,
          0.65
        );
      }
    }

    for (
      const action
      of getExplicitOperationActions(
        signal
      )
    ) {
      addEvidence(
        action,
        signal,
        1
      );
    }

    for (
      const action
      of getHttpMethodActions(
        signal
      )
    ) {
      addEvidence(
        action,
        signal,
        0.75
      );
    }
  }

  const proposals:
    ScannerActionProposal[] = [];

  for (
    const [
      action,
      evidence,
    ]
    of actionEvidence.entries()
  ) {
    const score =
      aggregateEvidenceScore(
        evidence
      );

    /*
     * Unsupported actions should not clutter manual review.
     *
     * Raw signals still remain available.
     */
    if (score < 0.35) {
      continue;
    }

    proposals.push({
      action:
        action as
          ScannerActionProposal["action"],

      confidence:
        getConfidence(score),

      confidenceScore:
        score,

      evidence,
    });
  }

  return proposals.sort(
    (a, b) =>
      b.confidenceScore -
      a.confidenceScore
  );
}

/* =========================================================
   DISCOVERED NAMES
========================================================= */

function collectDiscoveredNames(
  signals: ScannerSignal[]
): string[] {
  const names =
    new Set<string>();

  for (const signal of signals) {
    if (
      [
        "supabase-table",
        "api-route",
        "route",
        "function-name",
        "identifier",
        "directory",
      ].includes(
        signal.kind
      )
    ) {
      names.add(
        signal.value
      );
    }
  }

  return [
    ...names,
  ].slice(0, 50);
}

/* =========================================================
   TRUE AMBIGUITY TERMS

   These are terms that can genuinely mean different things
   across unrelated capabilities.

   We only create automatic conflicts from explicit
   ambiguous terminology.

   Shared compound concepts such as:

   product_inventory
   product_image
   order_items

   are NOT conflicts.

   They are legitimate evidence that multiple related
   capabilities coexist.
========================================================= */

const AMBIGUOUS_TERMS =
  new Set([
    "entry",
    "entries",
    "message",
    "messages",
    "request",
    "requests",
    "item",
    "items",
    "client",
    "clients",
    "record",
    "records",
    "content",
  ]);

/* =========================================================
   CONFLICT DETECTION

   Scanner v1 is intentionally conservative.

   A shared signal does NOT automatically mean conflict.

   Example:

   product_inventory
       ↓
   products
   inventory

   That is legitimate multi-capability evidence.

   A conflict exists only when the exact local term is
   intentionally classified as ambiguous AND strong evidence
   assigns that same term to multiple canonical capabilities.
========================================================= */

function detectConflicts(
  capabilityEvidenceMap: Map<
    string,
    ScannerEvidence[]
  >
): Set<string> {
  const ownership =
    new Map<
      string,
      Set<string>
    >();

  for (
    const [
      capabilityKey,
      evidence,
    ]
    of capabilityEvidenceMap.entries()
  ) {
    for (const item of evidence) {
      /*
       * Weak evidence cannot create a conflict.
       */
      if (
        item.weight < 0.65
      ) {
        continue;
      }

      const normalizedValue =
        normalizeScannerTerm(
          item.value
        );

      /*
       * Compound or specific names should be allowed to
       * support multiple compatible capabilities.
       */
      if (
        !AMBIGUOUS_TERMS.has(
          normalizedValue
        )
      ) {
        continue;
      }

      const identity = [
        item.filePath,
        item.line ?? "none",
        normalizedValue,
      ].join("|");

      const owners =
        ownership.get(
          identity
        ) ??
        new Set<string>();

      owners.add(
        capabilityKey
      );

      ownership.set(
        identity,
        owners
      );
    }
  }

  const conflicts =
    new Set<string>();

  for (
    const owners
    of ownership.values()
  ) {
    if (
      owners.size <= 1
    ) {
      continue;
    }

    for (
      const owner
      of owners
    ) {
      conflicts.add(
        owner
      );
    }
  }

  return conflicts;
}

/* =========================================================
   MAIN MATCHER
========================================================= */

export function matchCapabilities(
  signals: ScannerSignal[]
): ScannerCapabilityProposal[] {
  const capabilityEvidenceMap =
    new Map<
      string,
      ScannerEvidence[]
    >();

  const capabilitySignalMap =
    new Map<
      string,
      ScannerSignal[]
    >();

  /* =======================================================
     COLLECT CAPABILITY EVIDENCE
  ======================================================= */

  for (
    const definition
    of canonicalCapabilityLanguage
  ) {
    const evidence:
      ScannerEvidence[] = [];

    const matchedSignals:
      ScannerSignal[] = [];

    for (
      const signal
      of signals
    ) {
      const result =
        signalMatchesCapability(
          signal,

          definition.aliases,

          definition.strongSignals ??
            []
        );

      if (
        !result.matched
      ) {
        continue;
      }

      /*
       * Strong semantic identifiers receive a small boost.

       * Example:
       * product_inventory
       * custom_inquiries
       * donation_amount
       */
      const multiplier =
        result.strong
          ? 1.15
          : 1;

      evidence.push(
        createEvidence(
          signal,
          multiplier
        )
      );

      matchedSignals.push(
        signal
      );
    }

    if (
      !evidence.length
    ) {
      continue;
    }

    capabilityEvidenceMap.set(
      definition.capabilityKey,
      evidence
    );

    capabilitySignalMap.set(
      definition.capabilityKey,
      matchedSignals
    );
  }

  /* =======================================================
     DETECT TRUE AMBIGUITY
  ======================================================= */

  const conflicts =
    detectConflicts(
      capabilityEvidenceMap
    );

  /* =======================================================
     BUILD PROPOSALS
  ======================================================= */

  const proposals:
    ScannerCapabilityProposal[] = [];

  for (
    const definition
    of canonicalCapabilityLanguage
  ) {
    const evidence =
      capabilityEvidenceMap.get(
        definition.capabilityKey
      );

    const matchedSignals =
      capabilitySignalMap.get(
        definition.capabilityKey
      );

    if (
      !evidence ||
      !matchedSignals
    ) {
      continue;
    }

    /*
     * Critical Scanner v1 rule:
     *
     * Descriptive source-code concepts are not enough.
     *
     * A proposal must have evidence that the capability
     * is actually implemented operationally.
     */
    if (
      !hasImplementationAnchor(
        matchedSignals,
        definition.actions
      )
    ) {
      continue;
    }

    const score =
      aggregateEvidenceScore(
        evidence
      );

    /*
     * Very weak matches remain raw scanner signals only.
     */
    if (
      score < 0.35
    ) {
      continue;
    }

    const hasConflict =
      conflicts.has(
        definition.capabilityKey
      );

    const actions =
      buildActionProposals(
        matchedSignals,
        definition.actions
      );

    proposals.push({
      capabilityKey:
        definition.capabilityKey,

      capabilityLabel:
        definition.label,

      discoveredNames:
        collectDiscoveredNames(
          matchedSignals
        ),

      actions,

      confidence:
        getConfidence(
          score,
          hasConflict
        ),

      confidenceScore:
        score,

      evidence,

      /*
       * Scanner never skips manual review.
       */
      status:
        "proposed",
    });
  }

  return proposals.sort(
    (a, b) =>
      b.confidenceScore -
      a.confidenceScore
  );
}