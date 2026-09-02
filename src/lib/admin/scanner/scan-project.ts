import path from "node:path";

import {
  discoverSourceFiles,
} from "./source-files";

import {
  detectProjectSignals,
} from "./signal-detector";

import {
  matchCapabilities,
} from "./capability-matcher";

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

   Run the Scanner discovery pipeline from either:

   1. A local project root
   2. A pre-discovered set of safe source files

   This keeps source acquisition separate from scanner
   intelligence.

   IMPORTANT:

   The scanner remains:

   - read-only
   - proposal-only
   - unable to approve capabilities
   - unable to enable capabilities

   detected !== approved !== enabled
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

  if (
    hasAppRouter &&
    hasPagesRouter
  ) {
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
    const content =
      file.content;

    const relativePath =
      file.relativePath.toLowerCase();

    if (
      content.includes("@supabase/") ||
      content.includes(".from(") ||
      content.includes("createClient(") ||
      content.includes(
        "createServerClient("
      )
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
  return warnings.map(
    (message) => {
      let code:
        ScannerWarning["code"] =
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
    }
  );
}

/* =========================================================
   PROPOSAL WARNINGS
========================================================= */

function createProposalWarnings(
  result: ReturnType<
    typeof matchCapabilities
  >
): ScannerWarning[] {
  const warnings:
    ScannerWarning[] = [];

  for (const proposal of result) {
    if (
      proposal.confidence ===
      "conflict"
    ) {
      warnings.push({
        code:
          "conflicting-capability",

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
        code:
          "ambiguous-capability",

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
   LOCAL SCAN OPTIONS
========================================================= */

export type ScanProjectOptions = {
  maxFileSizeBytes?: number;
  maxFiles?: number;
  includeExtensions?: string[];
  ignoreDirectories?: string[];
  ignoreFiles?: string[];
};

/* =========================================================
   GENERIC SOURCE INPUT

   This is the important separation.

   Scanner intelligence consumes ScannerSourceFile[].

   It does not care whether those files came from:

   - local disk
   - a universal connector
   - a repository provider
   - another future source provider
========================================================= */

export type ScanSourceFilesInput = {
  projectRoot: string;
  projectName: string;

  files: ScannerSourceFile[];

  filesIgnored?: number;

  discoveryWarnings?: string[];

  scannedAt?: string;
};

/* =========================================================
   GENERIC SCANNER

   All actual discovery intelligence begins here.

   This function does NOT touch the filesystem.
========================================================= */

export function scanSourceFiles(
  input: ScanSourceFilesInput
): ScannerResult {
  const signals =
    detectProjectSignals(
      input.files
    );

  const proposals =
    matchCapabilities(
      signals
    );

  const framework =
    detectFramework(
      input.files
    );

  const backends =
    detectBackends(
      input.files
    );

  const warnings:
    ScannerWarning[] = [
      ...convertDiscoveryWarnings(
        input.discoveryWarnings ??
          []
      ),

      ...createProposalWarnings(
        proposals
      ),
    ];

  return {
    scannerVersion: "1",

    project: {
      projectRoot:
        input.projectRoot,

      projectName:
        input.projectName,

      framework,

      backends,

      scannedAt:
        input.scannedAt ??
        new Date().toISOString(),

      filesExamined:
        input.files.length,

      filesIgnored:
        input.filesIgnored ?? 0,

      signalsDetected:
        signals.length,
    },

    signals,

    proposals,

    warnings,
  };
}

/* =========================================================
   LOCAL FILESYSTEM ADAPTER

   Existing Scanner v1 behavior remains intact.

   Local project root
       ↓
   discover source files
       ↓
   scanSourceFiles()

   Later, the universal connector can provide the same
   ScannerSourceFile[] input without changing the scanner.
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

  return scanSourceFiles({
    projectRoot:
      resolvedRoot,

    projectName:
      getProjectName(
        resolvedRoot
      ),

    files:
      discovery.files,

    filesIgnored:
      discovery.ignoredFiles,

    discoveryWarnings:
      discovery.warnings,
  });
}