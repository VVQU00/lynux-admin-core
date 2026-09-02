import path from "node:path";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { z } from "zod";

import {
  authenticateSiteConnector,
} from "@/lib/admin/connector-auth";

import {
  getOrCreateScannerReviewSession,
} from "@/lib/admin/scanner/review-persistence";

import {
  scanSourceFiles,
} from "@/lib/admin/scanner/scan-project";

import type {
  ScannerFileType,
  ScannerSourceFile,
} from "@/lib/admin/scanner/types";

import {
  createSupabaseAdminClient,
} from "@/lib/admin/supabase/server";


/* =========================================================
   LYNUX UNIVERSAL CONNECTOR
   GENERIC SOURCE SNAPSHOT INTAKE

   IMPORTANT:

   The connector sends generic source only.

   The connector does NOT send:

   - capability decisions
   - approval decisions
   - enabled state
   - canonical mappings

   All interpretation remains inside Admin Core.
========================================================= */


/* =========================================================
   LIMITS

   These match Scanner v1's current source safety policy.
========================================================= */

const MAX_FILES =
  5_000;

const MAX_FILE_SIZE_BYTES =
  1_000_000;

const ALLOWED_EXTENSIONS =
  new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".sql",
  ]);

const SECRET_FILE_PATTERNS = [
  /^\.env$/i,
  /^\.env\./i,
  /secret/i,
  /credentials/i,
  /service-account/i,
  /private-key/i,
  /\.pem$/i,
  /\.key$/i,
];


/* =========================================================
   REQUEST CONTRACT

   Keep the connector payload intentionally dumb.

   It only needs to send:

   relativePath
   content

   Admin Core derives everything else.
========================================================= */

const sourceFileSchema =
  z.object({
    relativePath: z
      .string()
      .trim()
      .min(1)
      .max(500),

    content: z
      .string(),
  });

const requestSchema =
  z.object({
    files: z
      .array(
        sourceFileSchema
      )
      .max(MAX_FILES),

    ignoredFiles: z
      .number()
      .int()
      .nonnegative()
      .optional(),

    warnings: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(1_000)
      )
      .max(100)
      .optional(),
  });


/* =========================================================
   FILE TYPE
========================================================= */

function getFileType(
  extension: string
): ScannerFileType {
  switch (
    extension.toLowerCase()
  ) {
    case ".ts":
      return "typescript";

    case ".tsx":
      return "tsx";

    case ".js":
      return "javascript";

    case ".jsx":
      return "jsx";

    case ".json":
      return "json";

    case ".sql":
      return "sql";

    default:
      return "unknown";
  }
}


/* =========================================================
   SAFE RELATIVE PATH

   Never trust source paths supplied by a remote connector.

   Reject:

   ../
   absolute paths
   Windows drive paths
   malformed traversal
========================================================= */

function normalizeRelativePath(
  value: string
): string | null {
  const normalized =
    value
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

  if (!normalized) {
    return null;
  }

  if (
    normalized.includes("../") ||
    normalized === ".."
  ) {
    return null;
  }

  if (
    /^[a-zA-Z]:\//.test(
      normalized
    )
  ) {
    return null;
  }

  const clean =
    path.posix.normalize(
      normalized
    );

  if (
    clean.startsWith("../") ||
    clean === ".."
  ) {
    return null;
  }

  return clean;
}


/* =========================================================
   SECRET-LIKE FILE CHECK
========================================================= */

function isSecretLikeFile(
  relativePath: string
): boolean {
  const fileName =
    path.posix.basename(
      relativePath
    );

  return SECRET_FILE_PATTERNS.some(
    (pattern) =>
      pattern.test(fileName)
  );
}


/* =========================================================
   CONVERT CONNECTOR SOURCE

   The connector supplies generic data.

   Admin Core creates ScannerSourceFile[].
========================================================= */

function createScannerSourceFiles(
  siteId: string,
  files: z.infer<
    typeof sourceFileSchema
  >[]
): {
  files: ScannerSourceFile[];
  rejectedFiles: number;
  warnings: string[];
} {
  const scannerFiles:
    ScannerSourceFile[] = [];

  const warnings:
    string[] = [];

  let rejectedFiles = 0;

  for (
    const sourceFile of files
  ) {
    const relativePath =
      normalizeRelativePath(
        sourceFile.relativePath
      );

    if (!relativePath) {
      rejectedFiles += 1;

      warnings.push(
        `Rejected unsafe source path: ${sourceFile.relativePath}`
      );

      continue;
    }

    if (
      isSecretLikeFile(
        relativePath
      )
    ) {
      rejectedFiles += 1;

      warnings.push(
        `Rejected secret-like source file: ${relativePath}`
      );

      continue;
    }

    const extension =
      path.posix
        .extname(
          relativePath
        )
        .toLowerCase();

    if (
      !ALLOWED_EXTENSIONS.has(
        extension
      )
    ) {
      rejectedFiles += 1;

      continue;
    }

    const size =
      Buffer.byteLength(
        sourceFile.content,
        "utf8"
      );

    if (
      size >
      MAX_FILE_SIZE_BYTES
    ) {
      rejectedFiles += 1;

      warnings.push(
        `Rejected oversized source file: ${relativePath}`
      );

      continue;
    }

    scannerFiles.push({
      /*
       * This is a virtual path.
       *
       * Admin Core never needs the website's
       * real operating-system path.
       */
      absolutePath:
        `connector://${siteId}/${relativePath}`,

      relativePath,

      extension,

      fileType:
        getFileType(
          extension
        ),

      size,

      content:
        sourceFile.content,
    });
  }

  return {
    files:
      scannerFiles,

    rejectedFiles,

    warnings,
  };
}


/* =========================================================
   POST
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    /* =====================================================
       AUTHENTICATE UNIVERSAL CONNECTOR

       siteId comes from trusted connector authentication.

       Never trust a siteId sent in the request body.
    ===================================================== */

    const auth =
      await authenticateSiteConnector(
        request
      );

    if (!auth.authenticated) {
      return NextResponse.json(
        {
          ok: false,
          authenticated: false,
          reason:
            auth.reason,
        },
        {
          status: 401,
        }
      );
    }


    /* =====================================================
       VALIDATE GENERIC SOURCE SNAPSHOT
    ===================================================== */

    const body =
      requestSchema.parse(
        await request.json()
      );


    /* =====================================================
       LOAD SITE IDENTITY

       Project identity comes from Admin Core's database,
       not from connector-submitted metadata.
    ===================================================== */

    const supabase =
      createSupabaseAdminClient();

    const {
      data: site,
      error: siteError,
    } = await supabase
      .from("sites")
      .select(`
        id,
        name,
        slug
      `)
      .eq(
        "id",
        auth.siteId
      )
      .maybeSingle();

    if (
      siteError ||
      !site
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Authenticated site was not found.",
        },
        {
          status: 404,
        }
      );
    }


    /* =====================================================
       NORMALIZE SOURCE

       No capability interpretation occurs here.
    ===================================================== */

    const normalized =
      createScannerSourceFiles(
        auth.siteId,
        body.files
      );

    if (
      normalized.files.length ===
      0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No safe scanner source files were provided.",
        },
        {
          status: 400,
        }
      );
    }


    /* =====================================================
       RUN CENTRALIZED SCANNER

       All scanner intelligence remains in Admin Core.
    ===================================================== */

    const scanResult =
      scanSourceFiles({
        /*
         * Stable virtual root for connector-driven scans.
         *
         * This replaces local C:\... paths.
         */
        projectRoot:
          `connector://${auth.siteId}`,

        projectName:
          site.slug ||
          site.name ||
          auth.siteId,

        files:
          normalized.files,

        filesIgnored:
          (
            body.ignoredFiles ??
            0
          ) +
          normalized.rejectedFiles,

        discoveryWarnings: [
          ...(
            body.warnings ??
            []
          ),

          ...normalized.warnings,
        ],
      });


    /* =====================================================
       USE EXISTING REVIEW PERSISTENCE

       No second scanner database system.

       detected ≠ approved ≠ enabled
    ===================================================== */

    const reviewSession =
      await getOrCreateScannerReviewSession(
        supabase,
        auth.siteId,
        scanResult
      );


    /* =====================================================
       SITE CONNECTION / SCAN STATE

       This marks successful discovery only.

       It does NOT approve or enable capabilities.
    ===================================================== */

    const now =
      new Date().toISOString();

    const {
      error: siteUpdateError,
    } = await supabase
      .from("sites")
      .update({
        connection_status:
          "connected",

        health_status:
          "healthy",

        updated_at:
          now,
      })
      .eq(
        "id",
        auth.siteId
      );

    if (siteUpdateError) {
      console.error(
        "LYNUX scanner source site status update failed:",
        siteUpdateError.code
      );
    }


    /* =====================================================
       RESPONSE

       Keep response compact.

       The full evidence already lives in the existing
       scanner review persistence system.
    ===================================================== */

    return NextResponse.json({
      ok: true,

      authenticated: true,

      siteId:
        auth.siteId,

      connectorId:
        auth.connectorId,

      scannerVersion:
        scanResult.scannerVersion,

      project: {
        name:
          scanResult.project
            .projectName,

        framework:
          scanResult.project
            .framework,

        backends:
          scanResult.project
            .backends,

        filesExamined:
          scanResult.project
            .filesExamined,

        filesIgnored:
          scanResult.project
            .filesIgnored,

        signalsDetected:
          scanResult.project
            .signalsDetected,
      },

      proposals:
        scanResult.proposals
          .length,

      warnings:
        scanResult.warnings
          .length,

      review: {
        total:
          reviewSession.items
            .length,

        pending:
          reviewSession.items.filter(
            (item) =>
              item.review
                .decision ===
              "pending"
          ).length,

        approved:
          reviewSession.items.filter(
            (item) =>
              item.review
                .decision ===
              "approved"
          ).length,

        rejected:
          reviewSession.items.filter(
            (item) =>
              item.review
                .decision ===
              "rejected"
          ).length,
      },
    });
  } catch (error) {
    if (
      error instanceof
      z.ZodError
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid LYNUX scanner source snapshot.",
        },
        {
          status: 400,
        }
      );
    }

    console.error(
      "LYNUX connector scanner source intake failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Unable to process LYNUX scanner source snapshot.",
      },
      {
        status: 500,
      }
    );
  }
}