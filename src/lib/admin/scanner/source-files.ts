import fs from "node:fs/promises";
import path from "node:path";

import type {
  ScannerFileType,
  ScannerSourceFile,
} from "./types";

/* =========================================================
   LYNUX SCANNER V1 — SOURCE FILE DISCOVERY

   Purpose:
   Recursively inspect meaningful project source files while
   ignoring generated, dependency, cache, secret, and binary
   content.

   IMPORTANT:
   This scanner is read-only.
   It never modifies the scanned project.
========================================================= */

const SCANNABLE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".sql",
]);

const IGNORED_DIRECTORIES = new Set([
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

const IGNORED_FILES = new Set([
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

export type SourceDiscoveryOptions = {
  maxFileSizeBytes?: number;

  maxFiles?: number;

  includeExtensions?: string[];

  ignoreDirectories?: string[];

  ignoreFiles?: string[];
};

export type SourceDiscoveryResult = {
  files: ScannerSourceFile[];

  ignoredFiles: number;

  warnings: string[];
};

function getFileType(extension: string): ScannerFileType {
  switch (extension.toLowerCase()) {
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

function isSecretLikeFile(fileName: string): boolean {
  return SECRET_FILE_PATTERNS.some((pattern) =>
    pattern.test(fileName)
  );
}

function normalizeExtension(extension: string): string {
  if (!extension) {
    return "";
  }

  return extension.startsWith(".")
    ? extension.toLowerCase()
    : `.${extension.toLowerCase()}`;
}

function createAllowedExtensions(
  includeExtensions?: string[]
): Set<string> {
  if (!includeExtensions?.length) {
    return new Set(SCANNABLE_EXTENSIONS);
  }

  return new Set(
    includeExtensions.map(normalizeExtension)
  );
}

/* =========================================================
   SOURCE DISCOVERY
========================================================= */

export async function discoverSourceFiles(
  projectRoot: string,
  options: SourceDiscoveryOptions = {}
): Promise<SourceDiscoveryResult> {
  const root = path.resolve(projectRoot);

  const maxFileSizeBytes =
    options.maxFileSizeBytes ?? 1_000_000;

  const maxFiles =
    options.maxFiles ?? 5_000;

  const allowedExtensions =
    createAllowedExtensions(
      options.includeExtensions
    );

  const ignoredDirectories = new Set([
    ...IGNORED_DIRECTORIES,
    ...(options.ignoreDirectories ?? []),
  ]);

  const ignoredFiles = new Set([
    ...IGNORED_FILES,
    ...(options.ignoreFiles ?? []),
  ]);

  const files: ScannerSourceFile[] = [];

  const warnings: string[] = [];

  let ignoredCount = 0;

  async function walkDirectory(
    directoryPath: string
  ): Promise<void> {
    if (files.length >= maxFiles) {
      return;
    }

    let entries;

    try {
      entries = await fs.readdir(directoryPath, {
        withFileTypes: true,
      });
    } catch (error) {
      warnings.push(
        `Unable to read directory: ${directoryPath}`
      );

      return;
    }

    for (const entry of entries) {
      if (files.length >= maxFiles) {
        warnings.push(
          `Scanner stopped after reaching the file limit of ${maxFiles}.`
        );

        return;
      }

      const absolutePath = path.join(
        directoryPath,
        entry.name
      );

      if (entry.isDirectory()) {
        if (ignoredDirectories.has(entry.name)) {
          ignoredCount += 1;
          continue;
        }

        await walkDirectory(absolutePath);
        continue;
      }

      if (!entry.isFile()) {
        ignoredCount += 1;
        continue;
      }

      if (ignoredFiles.has(entry.name)) {
        ignoredCount += 1;
        continue;
      }

      if (isSecretLikeFile(entry.name)) {
        ignoredCount += 1;
        continue;
      }

      const extension =
        path.extname(entry.name).toLowerCase();

      if (!allowedExtensions.has(extension)) {
        ignoredCount += 1;
        continue;
      }

      let stats;

      try {
        stats = await fs.stat(absolutePath);
      } catch {
        warnings.push(
          `Unable to inspect file: ${absolutePath}`
        );

        ignoredCount += 1;

        continue;
      }

      if (stats.size > maxFileSizeBytes) {
        warnings.push(
          `Skipped oversized source file: ${absolutePath}`
        );

        ignoredCount += 1;

        continue;
      }

      let content: string;

      try {
        content = await fs.readFile(
          absolutePath,
          "utf8"
        );
      } catch {
        warnings.push(
          `Unable to read source file: ${absolutePath}`
        );

        ignoredCount += 1;

        continue;
      }

      files.push({
        absolutePath,

        relativePath: path
          .relative(root, absolutePath)
          .replace(/\\/g, "/"),

        extension,

        fileType: getFileType(extension),

        size: stats.size,

        content,
      });
    }
  }

  await walkDirectory(root);

  return {
    files,
    ignoredFiles: ignoredCount,
    warnings,
  };
}