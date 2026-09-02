import "server-only";

import path from "node:path";

import type {
  ScannerFileType,
  ScannerSourceFile,
} from "./types";

import {
  createSupabaseAdminClient,
} from "@/lib/admin/supabase/server";


/* =========================================================
   LYNUX SCANNER — GITHUB SOURCE PROVIDER

   Purpose:

   Admin Core reads a site's registered GitHub repository
   and converts safe repository source into ScannerSourceFile[].

   IMPORTANT:

   This runs entirely inside Admin Core.

   Websites do NOT:
   - declare capabilities
   - run scanner logic
   - map canonical features
   - approve anything
   - enable anything
========================================================= */


/* =========================================================
   SAFETY POLICY
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

const IGNORED_DIRECTORIES =
  new Set([
    "node_modules",
    ".next",
    ".git",
    ".vercel",
    ".turbo",
    ".cache",
    "coverage",
    "dist",
    "build",
    "out",
    "public",
  ]);

const IGNORED_FILES =
  new Set([
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "bun.lockb",
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
   TYPES
========================================================= */

type SiteSourceRow = {
  site_id: string;
  provider: string;
  repository_owner: string;
  repository_name: string;
  branch: string;
  subdirectory: string | null;
};

type GithubTreeItem = {
  path?: string;
  mode?: string;
  type?: string;
  sha?: string;
  size?: number;
  url?: string;
};

type GithubTreeResponse = {
  sha?: string;
  url?: string;
  tree?: GithubTreeItem[];
  truncated?: boolean;
};

type GithubBlobResponse = {
  sha?: string;
  size?: number;
  encoding?: string;
  content?: string;
};

export type GithubSourceResult = {
  projectRoot: string;
  projectName: string;

  files: ScannerSourceFile[];

  ignoredFiles: number;

  warnings: string[];
};


/* =========================================================
   TOKEN
========================================================= */

function getGithubToken(): string {
  const token =
    process.env
      .LYNUX_GITHUB_TOKEN
      ?.trim();

  if (!token) {
    throw new Error(
      "Missing LYNUX_GITHUB_TOKEN."
    );
  }

  return token;
}


/* =========================================================
   GITHUB REQUEST
========================================================= */

async function githubFetch(
  url: string
): Promise<Response> {
  const token =
    getGithubToken();

  return fetch(
    url,
    {
      headers: {
        Accept:
          "application/vnd.github+json",

        Authorization:
          `Bearer ${token}`,

        "X-GitHub-Api-Version":
          "2022-11-28",

        "User-Agent":
          "LYNUX-Admin-Core",
      },

      cache: "no-store",
    }
  );
}


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
   PATH SAFETY
========================================================= */

function normalizeRepoPath(
  value: string
): string {
  return value
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");
}


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


function containsIgnoredDirectory(
  relativePath: string
): boolean {
  const segments =
    normalizeRepoPath(
      relativePath
    ).split("/");

  return segments.some(
    (segment) =>
      IGNORED_DIRECTORIES.has(
        segment
      )
  );
}


function shouldIgnoreFile(
  relativePath: string
): boolean {
  const normalized =
    normalizeRepoPath(
      relativePath
    );

  const fileName =
    path.posix.basename(
      normalized
    );

  if (
    containsIgnoredDirectory(
      normalized
    )
  ) {
    return true;
  }

  if (
    IGNORED_FILES.has(
      fileName
    )
  ) {
    return true;
  }

  if (
    isSecretLikeFile(
      normalized
    )
  ) {
    return true;
  }

  const extension =
    path.posix
      .extname(
        normalized
      )
      .toLowerCase();

  if (
    !ALLOWED_EXTENSIONS.has(
      extension
    )
  ) {
    return true;
  }

  return false;
}


/* =========================================================
   SUBDIRECTORY FILTER
========================================================= */

function applySubdirectory(
  relativePath: string,
  subdirectory: string | null
): string | null {
  if (!subdirectory) {
    return relativePath;
  }

  const cleanSubdirectory =
    normalizeRepoPath(
      subdirectory
    ).replace(/\/+$/, "");

  const cleanPath =
    normalizeRepoPath(
      relativePath
    );

  if (
    cleanPath ===
    cleanSubdirectory
  ) {
    return "";
  }

  const prefix =
    `${cleanSubdirectory}/`;

  if (
    !cleanPath.startsWith(
      prefix
    )
  ) {
    return null;
  }

  return cleanPath.slice(
    prefix.length
  );
}


/* =========================================================
   LOAD REGISTERED SOURCE
========================================================= */

async function loadSiteSource(
  siteId: string
): Promise<SiteSourceRow> {
  const supabase =
    createSupabaseAdminClient();

  const {
    data,
    error,
  } = await supabase
    .from("site_sources")
    .select(`
      site_id,
      provider,
      repository_owner,
      repository_name,
      branch,
      subdirectory
    `)
    .eq(
      "site_id",
      siteId
    )
    .maybeSingle();

  if (error) {
    console.error(
      "LYNUX site source lookup failed:",
      error.code
    );

    throw new Error(
      "Unable to load LYNUX site source."
    );
  }

  if (!data) {
    throw new Error(
      `No source repository is registered for site "${siteId}".`
    );
  }

  if (
    data.provider !==
    "github"
  ) {
    throw new Error(
      `Unsupported LYNUX source provider "${data.provider}".`
    );
  }

  return data as SiteSourceRow;
}


/* =========================================================
   LOAD REPOSITORY TREE
========================================================= */

async function loadGithubTree(
  source: SiteSourceRow
): Promise<GithubTreeResponse> {
  const owner =
    encodeURIComponent(
      source.repository_owner
    );

  const repository =
    encodeURIComponent(
      source.repository_name
    );

  const branch =
    encodeURIComponent(
      source.branch
    );

  const url =
    `https://api.github.com/repos/${owner}/${repository}/git/trees/${branch}?recursive=1`;

  const response =
    await githubFetch(
      url
    );

  if (!response.ok) {
    throw new Error(
      `GitHub tree request failed with status ${response.status}.`
    );
  }

  const body =
    (await response.json()) as
      GithubTreeResponse;

  if (
    !Array.isArray(
      body.tree
    )
  ) {
    throw new Error(
      "GitHub returned an invalid repository tree."
    );
  }

  return body;
}


/* =========================================================
   LOAD ONE BLOB
========================================================= */

async function loadGithubBlob(
  source: SiteSourceRow,
  sha: string
): Promise<GithubBlobResponse> {
  const owner =
    encodeURIComponent(
      source.repository_owner
    );

  const repository =
    encodeURIComponent(
      source.repository_name
    );

  const blobSha =
    encodeURIComponent(
      sha
    );

  const url =
    `https://api.github.com/repos/${owner}/${repository}/git/blobs/${blobSha}`;

  const response =
    await githubFetch(
      url
    );

  if (!response.ok) {
    throw new Error(
      `GitHub blob request failed with status ${response.status}.`
    );
  }

  return (
    await response.json()
  ) as GithubBlobResponse;
}


/* =========================================================
   DECODE BLOB
========================================================= */

function decodeGithubBlob(
  blob: GithubBlobResponse
): string {
  if (
    blob.encoding !==
      "base64" ||
    typeof blob.content !==
      "string"
  ) {
    throw new Error(
      "GitHub returned an unsupported blob encoding."
    );
  }

  return Buffer.from(
    blob.content.replace(
      /\n/g,
      ""
    ),
    "base64"
  ).toString("utf8");
}


/* =========================================================
   MAIN SOURCE PROVIDER
========================================================= */

export async function loadGithubScannerSource(
  siteId: string
): Promise<GithubSourceResult> {
  const source =
    await loadSiteSource(
      siteId
    );

  const tree =
    await loadGithubTree(
      source
    );

  const warnings:
    string[] = [];

  if (tree.truncated) {
    warnings.push(
      "GitHub returned a truncated repository tree. Scanner results may be incomplete."
    );
  }

  const scannerFiles:
    ScannerSourceFile[] = [];

  let ignoredFiles = 0;

  for (
    const item of tree.tree ??
    []
  ) {
    if (
      scannerFiles.length >=
      MAX_FILES
    ) {
      warnings.push(
        `Scanner stopped after reaching the file limit of ${MAX_FILES}.`
      );

      break;
    }

    if (
      item.type !==
        "blob" ||
      !item.path ||
      !item.sha
    ) {
      continue;
    }

    const repositoryPath =
      normalizeRepoPath(
        item.path
      );

    const relativePath =
      applySubdirectory(
        repositoryPath,
        source.subdirectory
      );

    if (
      relativePath ===
      null
    ) {
      continue;
    }

    if (
      !relativePath ||
      shouldIgnoreFile(
        relativePath
      )
    ) {
      ignoredFiles += 1;
      continue;
    }

    const declaredSize =
      typeof item.size ===
      "number"
        ? item.size
        : null;

    if (
      declaredSize !==
        null &&
      declaredSize >
        MAX_FILE_SIZE_BYTES
    ) {
      ignoredFiles += 1;

      warnings.push(
        `Skipped oversized source file: ${relativePath}`
      );

      continue;
    }

    let blob:
      GithubBlobResponse;

    try {
      blob =
        await loadGithubBlob(
          source,
          item.sha
        );
    } catch {
      ignoredFiles += 1;

      warnings.push(
        `Unable to read GitHub source file: ${relativePath}`
      );

      continue;
    }

    if (
      typeof blob.size ===
        "number" &&
      blob.size >
        MAX_FILE_SIZE_BYTES
    ) {
      ignoredFiles += 1;

      warnings.push(
        `Skipped oversized source file: ${relativePath}`
      );

      continue;
    }

    let content: string;

    try {
      content =
        decodeGithubBlob(
          blob
        );
    } catch {
      ignoredFiles += 1;

      warnings.push(
        `Unable to decode GitHub source file: ${relativePath}`
      );

      continue;
    }

    const size =
      Buffer.byteLength(
        content,
        "utf8"
      );

    if (
      size >
      MAX_FILE_SIZE_BYTES
    ) {
      ignoredFiles += 1;

      warnings.push(
        `Skipped oversized source file: ${relativePath}`
      );

      continue;
    }

    const extension =
      path.posix
        .extname(
          relativePath
        )
        .toLowerCase();

    scannerFiles.push({
      absolutePath:
        `github://${source.repository_owner}/${source.repository_name}@${source.branch}/${repositoryPath}`,

      relativePath,

      extension,

      fileType:
        getFileType(
          extension
        ),

      size,

      content,
    });
  }

  return {
    projectRoot:
      `github://${source.repository_owner}/${source.repository_name}@${source.branch}`,

    projectName:
      source.repository_name,

    files:
      scannerFiles,

    ignoredFiles,

    warnings,
  };
}