import "server-only";

/* =========================================================
   LYNUX SCANNER V1
   LOCAL PROJECT ROOT CONFIGURATION

   Scanner v1 currently reads local source projects.

   These paths are development-only configuration and should
   not live inside the Admin Core page component.

   Later this file can be replaced by connector-driven or
   database-backed scanner execution without changing the
   dashboard architecture.
========================================================= */

export const scannerProjectRoots:
  Record<string, string> = {
    "bluus-isle":
      process.env.LYNUX_SCANNER_ROOT_BLUUS_ISLE ??
      "",

    "bluu-diary":
      process.env.LYNUX_SCANNER_ROOT_BLUU_DIARY ??
      "",

    "island-mango-radio":
      process.env.LYNUX_SCANNER_ROOT_ISLAND_MANGO_RADIO ??
      "",

    "layers-of-hope-foundation":
      process.env.LYNUX_SCANNER_ROOT_LAYERS_OF_HOPE ??
      "",
  };


/* =========================================================
   RESOLVE PROJECT ROOT

   Empty or missing environment variables are treated as
   "scanner not configured for this site."

   This prevents accidental scanning of invalid paths.
========================================================= */

export function getScannerProjectRoot(
  siteSlug: string
): string | null {
  const projectRoot =
    scannerProjectRoots[
      siteSlug
    ]?.trim();

  if (!projectRoot) {
    return null;
  }

  return projectRoot;
}