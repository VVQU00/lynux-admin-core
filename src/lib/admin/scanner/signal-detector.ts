import path from "node:path";

import type {
  ScannerSignal,
  ScannerSourceFile,
} from "./types";

/* =========================================================
   LYNUX SCANNER V1 — SIGNAL DETECTOR

   Purpose:
   Extract raw, explainable signals from meaningful source
   files.

   IMPORTANT:
   This file does NOT decide which capability exists.
   It only records facts found in source code.
========================================================= */

type SignalPushInput = {
  kind: ScannerSignal["kind"];
  value: string;
  filePath: string;
  line: number | null;
  context: string | null;
};

function pushSignal(
  signals: ScannerSignal[],
  input: SignalPushInput
): void {
  const normalizedValue = input.value.trim();

  if (!normalizedValue) {
    return;
  }

  signals.push({
    kind: input.kind,
    value: normalizedValue,
    filePath: input.filePath,
    line: input.line,
    context: input.context,
  });
}

function getLineNumber(
  content: string,
  index: number
): number {
  return (
    content.slice(0, index).split("\n").length
  );
}

function getLineContext(
  content: string,
  lineNumber: number,
  radius = 1
): string {
  const lines = content.split("\n");

  const start = Math.max(
    0,
    lineNumber - 1 - radius
  );

  const end = Math.min(
    lines.length,
    lineNumber + radius
  );

  return lines
    .slice(start, end)
    .join("\n")
    .trim();
}

function normalizePath(
  value: string
): string {
  return value.replace(/\\/g, "/");
}

/* =========================================================
   FILE PATH SIGNALS
========================================================= */

function detectFilePathSignals(
  file: ScannerSourceFile,
  signals: ScannerSignal[]
): void {
  const relativePath = normalizePath(
    file.relativePath
  );

  pushSignal(signals, {
    kind: "file-path",
    value: relativePath,
    filePath: relativePath,
    line: null,
    context: null,
  });

  const directory = path
    .dirname(relativePath)
    .replace(/\\/g, "/");

  if (directory && directory !== ".") {
    pushSignal(signals, {
      kind: "directory",
      value: directory,
      filePath: relativePath,
      line: null,
      context: null,
    });
  }
}

/* =========================================================
   NEXT.JS ROUTE DETECTION
========================================================= */

function detectRouteSignals(
  file: ScannerSourceFile,
  signals: ScannerSignal[]
): void {
  const relativePath = normalizePath(
    file.relativePath
  );

  const appRouteMatch = relativePath.match(
    /(?:^|\/)app\/(.+?)\/route\.(?:ts|tsx|js|jsx)$/i
  );

  if (appRouteMatch) {
    const rawRoute = appRouteMatch[1];

    const route = `/${rawRoute
      .replace(/\(.*?\)\//g, "")
      .replace(/\/index$/i, "")
      .replace(/\[([^\]]+)\]/g, ":$1")}`;

    pushSignal(signals, {
      kind: "api-route",
      value: route,
      filePath: relativePath,
      line: null,
      context: relativePath,
    });
  }

  const pagesApiMatch = relativePath.match(
    /(?:^|\/)pages\/api\/(.+?)\.(?:ts|tsx|js|jsx)$/i
  );

  if (pagesApiMatch) {
    let route = `/api/${pagesApiMatch[1]}`;

    route = route
      .replace(/\/index$/i, "")
      .replace(/\[([^\]]+)\]/g, ":$1");

    pushSignal(signals, {
      kind: "api-route",
      value: route,
      filePath: relativePath,
      line: null,
      context: relativePath,
    });
  }

  const appPageMatch = relativePath.match(
    /(?:^|\/)app\/(.+?)\/page\.(?:ts|tsx|js|jsx)$/i
  );

  if (appPageMatch) {
    const rawRoute = appPageMatch[1];

    const route = `/${rawRoute
      .replace(/\(.*?\)\//g, "")
      .replace(/\/index$/i, "")
      .replace(/\[([^\]]+)\]/g, ":$1")}`;

    pushSignal(signals, {
      kind: "route",
      value: route,
      filePath: relativePath,
      line: null,
      context: relativePath,
    });
  }
}

/* =========================================================
   HTTP METHOD DETECTION
========================================================= */

function detectHttpMethods(
  file: ScannerSourceFile,
  signals: ScannerSignal[]
): void {
  const pattern =
    /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b|export\s+const\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g;

  for (const match of file.content.matchAll(
    pattern
  )) {
    const method =
      match[1] ?? match[2];

    if (!method) {
      continue;
    }

    const index =
      match.index ?? 0;

    const line =
      getLineNumber(file.content, index);

    pushSignal(signals, {
      kind: "http-method",
      value: method.toUpperCase(),
      filePath: file.relativePath,
      line,
      context: getLineContext(
        file.content,
        line
      ),
    });
  }
}

/* =========================================================
   SUPABASE TABLE DETECTION
========================================================= */

function detectSupabaseTables(
  file: ScannerSourceFile,
  signals: ScannerSignal[]
): void {
  const pattern =
    /\.from\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g;

  for (const match of file.content.matchAll(
    pattern
  )) {
    const tableName = match[1];

    const index =
      match.index ?? 0;

    const line =
      getLineNumber(file.content, index);

    pushSignal(signals, {
      kind: "supabase-table",
      value: tableName,
      filePath: file.relativePath,
      line,
      context: getLineContext(
        file.content,
        line,
        2
      ),
    });
  }
}

/* =========================================================
   SUPABASE OPERATION DETECTION
========================================================= */

function detectSupabaseOperations(
  file: ScannerSourceFile,
  signals: ScannerSignal[]
): void {
  const operations = [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
  ];

  const pattern = new RegExp(
    `\\.(${operations.join("|")})\\s*\\(`,
    "g"
  );

  for (const match of file.content.matchAll(
    pattern
  )) {
    const operation = match[1];

    const index =
      match.index ?? 0;

    const line =
      getLineNumber(file.content, index);

    pushSignal(signals, {
      kind: "supabase-operation",
      value: operation,
      filePath: file.relativePath,
      line,
      context: getLineContext(
        file.content,
        line,
        2
      ),
    });
  }
}

/* =========================================================
   FETCH CALL DETECTION
========================================================= */

function detectFetchCalls(
  file: ScannerSourceFile,
  signals: ScannerSignal[]
): void {
  const pattern =
    /fetch\s*\(\s*["'`]([^"'`]+)["'`]/g;

  for (const match of file.content.matchAll(
    pattern
  )) {
    const target = match[1];

    const index =
      match.index ?? 0;

    const line =
      getLineNumber(file.content, index);

    pushSignal(signals, {
      kind: "fetch-call",
      value: target,
      filePath: file.relativePath,
      line,
      context: getLineContext(
        file.content,
        line,
        2
      ),
    });
  }
}

/* =========================================================
   SERVER ACTION DETECTION
========================================================= */

function detectServerActions(
  file: ScannerSourceFile,
  signals: ScannerSignal[]
): void {
  if (
    !file.content.includes(
      '"use server"'
    ) &&
    !file.content.includes(
      "'use server'"
    )
  ) {
    return;
  }

  pushSignal(signals, {
    kind: "server-action",
    value: "use server",
    filePath: file.relativePath,
    line: null,
    context: null,
  });
}

/* =========================================================
   FUNCTION NAME DETECTION
========================================================= */

function detectFunctionNames(
  file: ScannerSourceFile,
  signals: ScannerSignal[]
): void {
  const patterns = [
    /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g,

    /(?:export\s+)?const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?\(/g,

    /(?:export\s+)?const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][A-Za-z0-9_$]*\s*=>/g,
  ];

  for (const pattern of patterns) {
    for (const match of file.content.matchAll(
      pattern
    )) {
      const functionName = match[1];

      const index =
        match.index ?? 0;

      const line =
        getLineNumber(file.content, index);

      pushSignal(signals, {
        kind: "function-name",
        value: functionName,
        filePath: file.relativePath,
        line,
        context: getLineContext(
          file.content,
          line
        ),
      });
    }
  }
}

/* =========================================================
   IMPORT DETECTION
========================================================= */

function detectImports(
  file: ScannerSourceFile,
  signals: ScannerSignal[]
): void {
  const patterns = [
    /from\s+["'`]([^"'`]+)["'`]/g,
    /require\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of file.content.matchAll(
      pattern
    )) {
      const importPath = match[1];

      const index =
        match.index ?? 0;

      const line =
        getLineNumber(file.content, index);

      pushSignal(signals, {
        kind: "import",
        value: importPath,
        filePath: file.relativePath,
        line,
        context: getLineContext(
          file.content,
          line
        ),
      });
    }
  }
}

/* =========================================================
   IDENTIFIER DETECTION

   This captures meaningful identifier names so the
   canonical matcher has additional local terminology.
========================================================= */

function detectIdentifiers(
  file: ScannerSourceFile,
  signals: ScannerSignal[]
): void {
  const pattern =
    /\b(?:const|let|var|type|interface|class)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;

  for (const match of file.content.matchAll(
    pattern
  )) {
    const identifier = match[1];

    const index =
      match.index ?? 0;

    const line =
      getLineNumber(file.content, index);

    pushSignal(signals, {
      kind: "identifier",
      value: identifier,
      filePath: file.relativePath,
      line,
      context: getLineContext(
        file.content,
        line
      ),
    });
  }
}

/* =========================================================
   KEYWORD SIGNALS

   These keywords are intentionally broad.
   The matcher later decides whether they matter.
========================================================= */

const DISCOVERY_KEYWORDS = [
  "product",
  "products",
  "order",
  "orders",
  "purchase",
  "checkout",
  "customer",
  "inventory",
  "booking",
  "appointment",
  "inquiry",
  "contact",
  "message",
  "post",
  "article",
  "journal",
  "diary",
  "entry",
  "donation",
  "donor",
  "event",
  "member",
  "membership",
  "playlist",
  "track",
  "audio",
  "stream",
  "upload",
  "publish",
  "refund",
  "fulfill",
];

function detectKeywords(
  file: ScannerSourceFile,
  signals: ScannerSignal[]
): void {
  for (const keyword of DISCOVERY_KEYWORDS) {
    const pattern = new RegExp(
      `\\b${keyword}\\b`,
      "gi"
    );

    let firstMatchOnly = true;

    for (const match of file.content.matchAll(
      pattern
    )) {
      if (!firstMatchOnly) {
        break;
      }

      const index =
        match.index ?? 0;

      const line =
        getLineNumber(file.content, index);

      pushSignal(signals, {
        kind: "keyword",
        value: keyword,
        filePath: file.relativePath,
        line,
        context: getLineContext(
          file.content,
          line
        ),
      });

      firstMatchOnly = false;
    }
  }
}

/* =========================================================
   FILE SCAN
========================================================= */

export function detectSignalsFromFile(
  file: ScannerSourceFile
): ScannerSignal[] {
  const signals: ScannerSignal[] = [];

  detectFilePathSignals(file, signals);

  detectRouteSignals(file, signals);

  detectHttpMethods(file, signals);

  detectSupabaseTables(file, signals);

  detectSupabaseOperations(
    file,
    signals
  );

  detectFetchCalls(file, signals);

  detectServerActions(file, signals);

  detectFunctionNames(file, signals);

  detectImports(file, signals);

  detectIdentifiers(file, signals);

  detectKeywords(file, signals);

  return signals;
}

/* =========================================================
   PROJECT SIGNAL SCAN
========================================================= */

export function detectProjectSignals(
  files: ScannerSourceFile[]
): ScannerSignal[] {
  const signals: ScannerSignal[] = [];

  for (const file of files) {
    signals.push(
      ...detectSignalsFromFile(file)
    );
  }

  return signals;
}