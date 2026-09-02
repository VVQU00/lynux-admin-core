import {
  redirect,
} from "next/navigation";

import {
  MasterDashboard,
} from "@/components/master-dashboard";

import {
  createDefaultFeatureConfig,
} from "@/lib/admin/default-features";

import {
  AdminAuthError,
  requireMasterAdmin,
} from "@/lib/admin/auth/require-master-admin";

import {
  createDefaultModuleSettings,
} from "@/lib/admin/module-settings";

import {
  getOrCreateScannerReviewSession,
} from "@/lib/admin/scanner/review-persistence";

import {
  loadGithubScannerSource,
} from "@/lib/admin/scanner/github-source";

import {
  scanSourceFiles,
} from "@/lib/admin/scanner/scan-project";

import type {
  ScannerReviewSession,
} from "@/lib/admin/scanner/types";

import {
  createSupabaseAdminClient,
} from "@/lib/admin/supabase/server";

import type {
  FeatureConfig,
  MasterSite,
  SiteCapability,
  SiteConnectionStatus,
  SiteEnvironment,
  SiteHealthStatus,
  SiteType,
} from "@/lib/admin/types";

export const dynamic =
  "force-dynamic";

/* =========================================================
   DATABASE ROW TYPES
========================================================= */

type SiteRow = {
  id: string;
  name: string;
  slug: string;

  site_type:
    | string
    | null;

  environment:
    | string
    | null;

  domain:
    | string
    | null;

  local_url:
    | string
    | null;

  connection_status:
    | string
    | null;

  health_status:
    | string
    | null;

  core_enabled:
    | boolean
    | null;

  created_at:
    | string
    | null;

  updated_at:
    | string
    | null;
};

type ConnectorRow = {
  site_id: string;

  status:
    | string
    | null;

  protocol_version:
    | string
    | null;

  connector_version:
    | string
    | null;

  connector_id:
    | string
    | null;

  last_authenticated_at:
    | string
    | null;

  last_heartbeat_at:
    | string
    | null;

  credential_version:
    | number
    | null;
};

type CapabilityRow = {
  site_id: string;
  capability_key: string;

  detected:
    | boolean
    | null;

  approved:
    | boolean
    | null;

  enabled:
    | boolean
    | null;

  confidence:
    | string
    | null;

  confidence_score:
    | number
    | null;

  detected_from:
    | string[]
    | null;

  last_verified_at:
    | string
    | null;
};

type ModuleSettingRow = {
  site_id: string;
  feature_key: string;
  setting_key: string;
  enabled: boolean;
};

type SiteFeatureState =
  Record<
    string,
    FeatureConfig
  >;

type ModuleState =
  Record<
    string,
    Record<
      string,
      Record<
        string,
        boolean
      >
    >
  >;

type ScannerSessionState =
  Record<
    string,
    ScannerReviewSession
  >;

/* =========================================================
   NORMALIZERS
========================================================= */

function normalizeSiteType(
  value:
    | string
    | null
): SiteType {
  switch (value) {
    case "business":
    case "commerce":
    case "diary":
    case "radio":
    case "nonprofit":
    case "portfolio":
    case "media":
    case "custom":
      return value;

    default:
      return "custom";
  }
}

function normalizeEnvironment(
  value:
    | string
    | null
): SiteEnvironment {
  switch (value) {
    case "development":
    case "staging":
    case "production":
      return value;

    default:
      return "development";
  }
}

function normalizeConnectionStatus(
  value:
    | string
    | null
): SiteConnectionStatus {
  switch (value) {
    case "not-configured":
    case "ready":
    case "connecting":
    case "connected":
    case "scanning":
    case "degraded":
    case "error":
    case "suspended":
    case "revoked":
    case "disconnected":
      return value;

    default:
      return "not-configured";
  }
}

function normalizeHealthStatus(
  value:
    | string
    | null
): SiteHealthStatus {
  switch (value) {
    case "unknown":
    case "healthy":
    case "warning":
    case "critical":
      return value;

    default:
      return "unknown";
  }
}

function normalizeConnectorStatus(
  value:
    | string
    | null
) {
  switch (value) {
    case "not-installed":
    case "inactive":
    case "active":
    case "expired":
    case "revoked":
    case "error":
      return value;

    default:
      return "not-installed";
  }
}

function normalizeConfidence(
  value:
    | string
    | null
) {
  switch (value) {
    case "verified":
    case "probable":
    case "possible":
    case "conflict":
    case "unsupported":
      return value;

    default:
      return "unsupported";
  }
}

function normalizeDetectedFrom(
  values:
    | string[]
    | null
): SiteCapability["detectedFrom"] {
  if (!values) {
    return [];
  }

  const allowed =
    new Set([
      "manifest",
      "registry",
      "api",
      "database",
      "route",
      "component",
      "manual",
    ]);

  return values.filter(
    (
      value
    ): value is
      SiteCapability["detectedFrom"][number] =>
      allowed.has(value)
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function AdminPage() {
  try {
    await requireMasterAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      redirect("/login");
    }

    throw error;
  }

  const implementation =
    "master" as const;

  const supabase =
    createSupabaseAdminClient();

  /* =========================================================
     LOAD ADMIN CORE DATA
  ========================================================= */

  const [
    sitesResult,
    connectorsResult,
    capabilitiesResult,
    moduleSettingsResult,
  ] =
    await Promise.all([
      supabase
        .from("sites")
        .select("*")
        .order(
          "created_at",
          {
            ascending:
              true,
          }
        ),

      supabase
        .from(
          "site_connectors"
        )
        .select("*"),

      supabase
        .from(
          "site_capabilities"
        )
        .select("*"),

      supabase
        .from(
          "module_settings"
        )
        .select("*"),
    ]);

  if (
    sitesResult.error
  ) {
    throw new Error(
      `Unable to load sites: ${sitesResult.error.message}`
    );
  }

  if (
    connectorsResult.error
  ) {
    throw new Error(
      `Unable to load site connectors: ${connectorsResult.error.message}`
    );
  }

  if (
    capabilitiesResult.error
  ) {
    throw new Error(
      `Unable to load site capabilities: ${capabilitiesResult.error.message}`
    );
  }

  if (
    moduleSettingsResult.error
  ) {
    throw new Error(
      `Unable to load module settings: ${moduleSettingsResult.error.message}`
    );
  }

  const siteRows =
    (
      sitesResult.data ??
      []
    ) as SiteRow[];

  const connectorRows =
    (
      connectorsResult.data ??
      []
    ) as ConnectorRow[];

  const capabilityRows =
    (
      capabilitiesResult.data ??
      []
    ) as CapabilityRow[];

  const moduleSettingRows =
    (
      moduleSettingsResult.data ??
      []
    ) as ModuleSettingRow[];

  /* =========================================================
     INDEX CONNECTORS
  ========================================================= */

  const connectorBySite =
    new Map<
      string,
      ConnectorRow
    >();

  for (
    const connector
    of connectorRows
  ) {
    connectorBySite.set(
      connector.site_id,
      connector
    );
  }

  /* =========================================================
     INDEX CAPABILITIES
  ========================================================= */

  const capabilitiesBySite =
    new Map<
      string,
      SiteCapability[]
    >();

  for (
    const capability
    of capabilityRows
  ) {
    const current =
      capabilitiesBySite.get(
        capability.site_id
      ) ?? [];

    current.push({
      key:
        capability.capability_key,

      detected:
        capability.detected ??
        false,

      approved:
        capability.approved ??
        false,

      enabled:
        capability.enabled ??
        false,

      confidence:
        normalizeConfidence(
          capability.confidence
        ),

      confidenceScore:
        capability.confidence_score ??
        0,

      detectedFrom:
        normalizeDetectedFrom(
          capability.detected_from
        ),

      lastVerifiedAt:
        capability.last_verified_at,
    });

    capabilitiesBySite.set(
      capability.site_id,
      current
    );
  }

  /* =========================================================
     BUILD MASTER SITES
  ========================================================= */

  const sites:
    MasterSite[] =
    siteRows.map(
      (
        row
      ) => {
        const connector =
          connectorBySite.get(
            row.id
          );

        const capabilities =
          capabilitiesBySite.get(
            row.id
          ) ?? [];

        const approvedCapabilities =
          capabilities.filter(
            (
              capability
            ) =>
              capability.approved
          ).length;

        const detectedCapabilities =
          capabilities.filter(
            (
              capability
            ) =>
              capability.detected
          ).length;

        return {
          id:
            row.id,

          name:
            row.name,

          slug:
            row.slug,

          siteType:
            normalizeSiteType(
              row.site_type
            ),

          environment:
            normalizeEnvironment(
              row.environment
            ),

          domain:
            row.domain,

          localUrl:
            row.local_url,

          connectionStatus:
            normalizeConnectionStatus(
              row.connection_status
            ),

          healthStatus:
            normalizeHealthStatus(
              row.health_status
            ),

          coreEnabled:
            row.core_enabled ??
            false,

          connector: {
            status:
              normalizeConnectorStatus(
                connector?.status ??
                  null
              ),

            protocolVersion:
              connector?.protocol_version ??
              "1",

            connectorVersion:
              connector?.connector_version ??
              "1",

            connectorId:
              connector?.connector_id ??
              null,

            lastAuthenticatedAt:
              connector?.last_authenticated_at ??
              null,

            lastHeartbeatAt:
              connector?.last_heartbeat_at ??
              null,

            credentialVersion:
              connector?.credential_version ??
              1,
          },

          scan: {
            status:
              "never",

            lastScanAt:
              null,

            lastSuccessfulScanAt:
              null,

            detectedCapabilities,

            approvedCapabilities,

            error:
              null,
          },

          capabilities,

          createdAt:
            row.created_at ??
            new Date(
              0
            ).toISOString(),

          updatedAt:
            row.updated_at ??
            new Date(
              0
            ).toISOString(),
        };
      }
    );

  /* =========================================================
     INITIAL FEATURE STATE

     Existing Admin Core enablement remains independent
     from scanner review approval.
  ========================================================= */

  const initialFeatureState:
    SiteFeatureState =
    {};

  for (
    const site
    of sites
  ) {
    const config =
      createDefaultFeatureConfig();

    for (
      const capability
      of site.capabilities
    ) {
      config[
        capability.key
      ] =
        capability.enabled;
    }

    initialFeatureState[
      site.id
    ] =
      config;
  }

  /* =========================================================
     INITIAL MODULE STATE
  ========================================================= */

  const initialModuleState:
    ModuleState =
    {};

  for (
    const site
    of sites
  ) {
    initialModuleState[
      site.id
    ] =
      {};
  }

  for (
    const setting
    of moduleSettingRows
  ) {
    if (
      !initialModuleState[
        setting.site_id
      ]
    ) {
      initialModuleState[
        setting.site_id
      ] =
        {};
    }

    if (
      !initialModuleState[
        setting.site_id
      ][
        setting.feature_key
      ]
    ) {
      initialModuleState[
        setting.site_id
      ][
        setting.feature_key
      ] =
        createDefaultModuleSettings(
          setting.feature_key
        );
    }

    initialModuleState[
      setting.site_id
    ][
      setting.feature_key
    ][
      setting.setting_key
    ] =
      setting.enabled;
  }

  /* =========================================================
     SCANNER REVIEW SESSIONS

     IMPORTANT:

     Source acquisition now happens centrally through each
     site's registered GitHub repository.

     Flow:

     site_sources
        ↓
     private GitHub repository
        ↓
     loadGithubScannerSource()
        ↓
     scanSourceFiles()
        ↓
     getOrCreateScannerReviewSession()

     Scanner remains read-only and proposal-only.

     detected ≠ approved ≠ enabled
  ========================================================= */

  const initialScannerSessions:
    ScannerSessionState =
    {};

  for (
    const site
    of sites
  ) {
    try {
      const source =
        await loadGithubScannerSource(
          site.id
        );

      const scanResult =
        scanSourceFiles({
          projectRoot:
            source.projectRoot,

          projectName:
            source.projectName,

          files:
            source.files,

          filesIgnored:
            source.ignoredFiles,

          discoveryWarnings:
            source.warnings,
        });

      const reviewSession =
        await getOrCreateScannerReviewSession(
          supabase,
          site.id,
          scanResult
        );

      initialScannerSessions[
        site.id
      ] =
        reviewSession;
    } catch (
      error
    ) {
      console.error(
        `LYNUX GitHub scanner failed for site "${site.slug}":`,
        error
      );
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <MasterDashboard
      implementation={
        implementation
      }
      sites={
        sites
      }
      initialFeatureState={
        initialFeatureState
      }
      initialModuleState={
        initialModuleState
      }
      initialScannerSessions={
        initialScannerSessions
      }
    />
  );
}