import path from "node:path";

import { discoverSourceFiles } from "./source-files";
import { detectProjectSignals } from "./signal-detector";
import { matchCapabilities } from "./capability-matcher";

import type {
  ScannerBackend,
  ScannerFramework,
  ScannerResult,
  ScannerSourceFile,
  ScannerWarning,
} from "./types";

/* =========================================================
   LYNUX SCANNER V1 — PROJECT ORCHESTRATOR

   Purpose:
   Run the complete Scanner v1 discovery pipeline.

   Flow:

   project root
      ↓
   recursive source discovery
      ↓
   raw signal detection
      ↓
   framework/backend detection
      ↓
   canonical capability matching
      ↓
   ScannerResult

   IMPORTANT:
   This remains read-only and proposal-only.
========================================================= */

/* =========================================================
   FRAMEWORK DETECTION
========================================================= */

function detectFramework(
  files: ScannerSourceFile[]
): ScannerFramework {
  let hasAppRouter = false;
  let hasPagesRouter = false;

  for (const file of files) {
    const relativePath =
      file.relativePath.toLowerCase();

    if (
      relativePath.startsWith("src/app/") ||
      relativePath.startsWith("app/")
    ) {
      if (
        /\/(?:page|layout|route)\.(?:ts|tsx|js|jsx)$/.test(
          relativePath
        )
      ) {
        hasAppRouter = true;
      }
    }

    if (
      relativePath.startsWith("src/pages/") ||
      relativePath.startsWith("pages/")
    ) {
      hasPagesRouter = true;
    }
  }

  if (hasAppRouter && hasPagesRouter) {
    return "nextjs-hybrid";
  }

  if (hasAppRouter) {
    return "nextjs-app-router";
  }

  if (hasPagesRouter) {
    return "nextjs-pages-router";
  }

  return "unknown";
}

/* =========================================================
   BACKEND DETECTION
========================================================= */

function detectBackends(
  files: ScannerSourceFile[]
): ScannerBackend[] {
  const detected =
    new Set<ScannerBackend>();

  for (const file of files) {
    const content = file.content;
    const relativePath =
      file.relativePath.toLowerCase();

    if (
      content.includes("@supabase/") ||
      content.includes(".from(") ||
      content.includes("createClient(") ||
      content.includes("createServerClient(")
    ) {
      detected.add("supabase");
    }

    if (
      /(?:^|\/)(?:src\/)?app\/.+\/route\.(?:ts|tsx|js|jsx)$/.test(
        relativePath
      ) ||
      /(?:^|\/)(?:src\/)?pages\/api\/.+\.(?:ts|tsx|js|jsx)$/.test(
        relativePath
      )
    ) {
      detected.add("nextjs-api");
    }

    if (
      content.includes('"use server"') ||
      content.includes("'use server'")
    ) {
      detected.add("server-actions");
    }
  }

  if (!detected.size) {
    return ["unknown"];
  }

  return [...detected];
}

/* =========================================================
   PROJECT NAME
========================================================= */

function getProjectName(
  projectRoot: string
): string {
  return path.basename(
    path.resolve(projectRoot)
  );
}

/* =========================================================
   WARNING CONVERSION
========================================================= */

function convertDiscoveryWarnings(
  warnings: string[]
): ScannerWarning[] {
  return warnings.map((message) => {
    let code: ScannerWarning["code"] =
      "parser-warning";

    if (
      message.includes(
        "file limit"
      )
    ) {
      code = "scan-limit";
    } else if (
      message.includes(
        "Unable to read source file"
      )
    ) {
      code = "unreadable-file";
    } else if (
      message.includes(
        "oversized source file"
      )
    ) {
      code = "unsupported-file";
    }

    return {
      code,
      message,
      filePath: null,
    };
  });
}

/* =========================================================
   PROPOSAL WARNINGS
========================================================= */

function createProposalWarnings(
  result: ReturnType<
    typeof matchCapabilities
  >
): ScannerWarning[] {
  const warnings: ScannerWarning[] =
    [];

  for (const proposal of result) {
    if (
      proposal.confidence ===
      "conflict"
    ) {
      warnings.push({
        code: "conflicting-capability",

        message:
          `Scanner found conflicting evidence for capability "${proposal.capabilityKey}". Manual review is required.`,

        filePath:
          proposal.evidence[0]
            ?.filePath ?? null,
      });

      continue;
    }

    if (
      proposal.confidence ===
      "possible"
    ) {
      warnings.push({
        code: "ambiguous-capability",

        message:
          `Scanner found low-confidence evidence for capability "${proposal.capabilityKey}".`,

        filePath:
          proposal.evidence[0]
            ?.filePath ?? null,
      });
    }
  }

  return warnings;
}

/* =========================================================
   SCAN OPTIONS
========================================================= */

export type ScanProjectOptions = {
  maxFileSizeBytes?: number;

  maxFiles?: number;

  includeExtensions?: string[];

  ignoreDirectories?: string[];

  ignoreFiles?: string[];
};

/* =========================================================
   MAIN SCANNER
========================================================= */

export async function scanProject(
  projectRoot: string,
  options: ScanProjectOptions = {}
): Promise<ScannerResult> {
  const resolvedRoot =
    path.resolve(projectRoot);

  const discovery =
    await discoverSourceFiles(
      resolvedRoot,
      {
        maxFileSizeBytes:
          options.maxFileSizeBytes,

        maxFiles:
          options.maxFiles,

        includeExtensions:
          options.includeExtensions,

        ignoreDirectories:
          options.ignoreDirectories,

        ignoreFiles:
          options.ignoreFiles,
      }
    );

  const signals =
    detectProjectSignals(
      discovery.files
    );

  const proposals =
    matchCapabilities(signals);

  const framework =
    detectFramework(
      discovery.files
    );

  const backends =
    detectBackends(
      discovery.files
    );

  const warnings: ScannerWarning[] = [
    ...convertDiscoveryWarnings(
      discovery.warnings
    ),

    ...createProposalWarnings(
      proposals
    ),
  ];

  return {
    scannerVersion: "1",

    project: {
      projectRoot:
        resolvedRoot,

      projectName:
        getProjectName(
          resolvedRoot
        ),

      framework,

      backends,

      scannedAt:
        new Date().toISOString(),

      filesExamined:
        discovery.files.length,

      filesIgnored:
        discovery.ignoredFiles,

      signalsDetected:
        signals.length,
    },

    signals,

    proposals,

    warnings,
  };
}