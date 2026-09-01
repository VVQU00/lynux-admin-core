import { MasterDashboard } from "@/components/master-dashboard";

import {
  createDefaultFeatureConfig,
} from "@/lib/admin/default-features";

import {
  getAdminImplementation,
} from "@/lib/admin/implementation";

import type {
  FeatureConfig,
  MasterSite,
} from "@/lib/admin/types";

import {
  createSupabaseAdminClient,
} from "@/lib/admin/supabase/server";

export const dynamic = "force-dynamic";

type SiteFeatureState = Record<string, FeatureConfig>;

type ModuleState = Record<
  string,
  Record<string, Record<string, boolean>>
>;

export default async function Home() {
  const implementation = getAdminImplementation();
  const supabase = createSupabaseAdminClient();

  /* =========================================================
     SITES
  ========================================================= */

  const { data: siteRows, error: siteError } = await supabase
    .from("sites")
    .select(`
      id,
      name,
      slug,
      site_type,
      environment,
      domain,
      local_url,
      connection_status,
      health_status,
      core_enabled,
      created_at,
      updated_at
    `)
    .order("created_at", {
      ascending: true,
    });

  if (siteError) {
    console.error(
      "LYNUX site registry load failed:",
      siteError.code
    );

    throw new Error(
      "Unable to load the LYNUX Master Site Registry."
    );
  }

  /* =========================================================
     CONNECTORS
  ========================================================= */

  const {
    data: connectorRows,
    error: connectorError,
  } = await supabase
    .from("site_connectors")
    .select(`
      site_id,
      connector_id,
      status,
      protocol_version,
      connector_version,
      credential_version,
      last_authenticated_at,
      last_heartbeat_at
    `);

  if (connectorError) {
    console.error(
      "LYNUX connector registry load failed:",
      connectorError.code
    );

    throw new Error(
      "Unable to load the LYNUX connector registry."
    );
  }

  /* =========================================================
     MAIN CAPABILITY STATES
  ========================================================= */

  const {
    data: capabilityRows,
    error: capabilityError,
  } = await supabase
    .from("site_capabilities")
    .select(`
      site_id,
      capability_key,
      enabled
    `);

  if (capabilityError) {
    console.error(
      "LYNUX capability state load failed:",
      capabilityError.code
    );

    throw new Error(
      "Unable to load LYNUX capability states."
    );
  }

  /* =========================================================
     MODULE SUB-SETTINGS
  ========================================================= */

  const {
    data: moduleRows,
    error: moduleError,
  } = await supabase
    .from("module_settings")
    .select(`
      site_id,
      feature_key,
      setting_key,
      enabled
    `);

  if (moduleError) {
    console.error(
      "LYNUX module setting load failed:",
      moduleError.code
    );

    throw new Error(
      "Unable to load LYNUX module settings."
    );
  }

  /* =========================================================
     CONNECTOR LOOKUP
  ========================================================= */

  const connectorBySite = new Map(
    (connectorRows ?? []).map((connector) => [
      connector.site_id,
      connector,
    ])
  );

  /* =========================================================
     NORMALIZE SITES
  ========================================================= */

  const sites: MasterSite[] = (siteRows ?? []).map((row) => {
    const connector = connectorBySite.get(row.id);

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,

      siteType: row.site_type,
      environment: row.environment,

      domain: row.domain,
      localUrl: row.local_url,

      connectionStatus: row.connection_status,
      healthStatus: row.health_status,

      coreEnabled: row.core_enabled,

      connector: {
        status: connector?.status ?? "not-installed",

        protocolVersion:
          connector?.protocol_version ?? "1.0.0",

        connectorVersion:
          connector?.connector_version ?? "0.1.0",

        connectorId:
          connector?.connector_id ?? null,

        lastAuthenticatedAt:
          connector?.last_authenticated_at ?? null,

        lastHeartbeatAt:
          connector?.last_heartbeat_at ?? null,

        credentialVersion:
          connector?.credential_version ?? 1,
      },

      scan: {
        status: "never",
        lastScanAt: null,
        lastSuccessfulScanAt: null,
        detectedCapabilities: 0,
        approvedCapabilities: 0,
        error: null,
      },

      capabilities: [],

      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

  /* =========================================================
     FEATURE STATE
  ========================================================= */

  const initialFeatureState: SiteFeatureState =
    Object.fromEntries(
      sites.map((site) => {
        const configuration =
          createDefaultFeatureConfig();

        for (const row of capabilityRows ?? []) {
          if (row.site_id === site.id) {
            configuration[row.capability_key] =
              row.enabled === true;
          }
        }

        return [
          site.id,
          configuration,
        ];
      })
    );

  /* =========================================================
     MODULE STATE
  ========================================================= */

  const initialModuleState: ModuleState = {};

  for (const row of moduleRows ?? []) {
    if (!initialModuleState[row.site_id]) {
      initialModuleState[row.site_id] = {};
    }

    if (
      !initialModuleState[row.site_id][row.feature_key]
    ) {
      initialModuleState[row.site_id][row.feature_key] = {};
    }

    initialModuleState[row.site_id][row.feature_key][
      row.setting_key
    ] = row.enabled === true;
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main>
      <MasterDashboard
        implementation={implementation}
        sites={sites}
        initialFeatureState={initialFeatureState}
        initialModuleState={initialModuleState}
      />
    </main>
  );
}