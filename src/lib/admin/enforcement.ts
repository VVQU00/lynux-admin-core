import "server-only";

import {
  featureRegistry,
} from "@/lib/admin/feature-registry";

import {
  moduleSettingsRegistry,
} from "@/lib/admin/module-settings";

import {
  createSupabaseAdminClient,
} from "@/lib/admin/supabase/server";

/* =========================================================
   TYPES
========================================================= */

export type EnforcementResult =
  | {
      allowed: true;
      siteId: string;
      capability: string;
      setting?: string;
    }
  | {
      allowed: false;
      reason:
        | "UNKNOWN_CAPABILITY"
        | "UNKNOWN_SETTING"
        | "SITE_NOT_FOUND"
        | "SITE_BLOCKED"
        | "CAPABILITY_NOT_APPROVED"
        | "CAPABILITY_DISABLED"
        | "SETTING_DISABLED"
        | "DATABASE_ERROR";
    };

/* =========================================================
   SITE BOUNDARY
========================================================= */

async function checkSiteBoundary(
  siteId: string
): Promise<
  | {
      allowed: true;
    }
  | {
      allowed: false;
      reason:
        | "SITE_NOT_FOUND"
        | "SITE_BLOCKED"
        | "DATABASE_ERROR";
    }
> {
  const supabase =
    createSupabaseAdminClient();

  const {
    data: site,
    error,
  } = await supabase
    .from("sites")
    .select(`
      id,
      connection_status
    `)
    .eq(
      "id",
      siteId
    )
    .maybeSingle();

  if (error) {
    console.error(
      "LYNUX enforcement site lookup failed:",
      error.code
    );

    return {
      allowed: false,
      reason: "DATABASE_ERROR",
    };
  }

  if (!site) {
    return {
      allowed: false,
      reason: "SITE_NOT_FOUND",
    };
  }

  if (
    site.connection_status ===
      "suspended" ||
    site.connection_status ===
      "revoked"
  ) {
    return {
      allowed: false,
      reason: "SITE_BLOCKED",
    };
  }

  return {
    allowed: true,
  };
}

/* =========================================================
   CAPABILITY CHECK
========================================================= */

export async function checkSiteCapability(
  siteId: string,
  featureKey: string
): Promise<EnforcementResult> {
  const definition =
    featureRegistry.find(
      (feature) =>
        feature.key ===
        featureKey
    );

  if (!definition) {
    return {
      allowed: false,
      reason:
        "UNKNOWN_CAPABILITY",
    };
  }

  const siteBoundary =
    await checkSiteBoundary(
      siteId
    );

  if (!siteBoundary.allowed) {
    return siteBoundary;
  }

  const supabase =
    createSupabaseAdminClient();

  const {
    data: capability,
    error,
  } = await supabase
    .from(
      "site_capabilities"
    )
    .select(`
      approved,
      enabled
    `)
    .eq(
      "site_id",
      siteId
    )
    .eq(
      "capability_key",
      featureKey
    )
    .maybeSingle();

  if (error) {
    console.error(
      "LYNUX enforcement capability lookup failed:",
      error.code
    );

    return {
      allowed: false,
      reason:
        "DATABASE_ERROR",
    };
  }

  /*
   * FAIL CLOSED:
   *
   * Missing database row does NOT
   * inherit a frontend/default ON state.
   */
  if (!capability) {
    return {
      allowed: false,
      reason:
        "CAPABILITY_NOT_APPROVED",
    };
  }

  if (
    capability.approved !==
    true
  ) {
    return {
      allowed: false,
      reason:
        "CAPABILITY_NOT_APPROVED",
    };
  }

  if (
    capability.enabled !==
    true
  ) {
    return {
      allowed: false,
      reason:
        "CAPABILITY_DISABLED",
    };
  }

  return {
    allowed: true,
    siteId,
    capability:
      featureKey,
  };
}

/* =========================================================
   MODULE SETTING CHECK
========================================================= */

export async function checkModuleSetting(
  siteId: string,
  featureKey: string,
  settingKey: string
): Promise<EnforcementResult> {
  const definitions =
    moduleSettingsRegistry[
      featureKey
    ] ?? [];

  const settingDefinition =
    definitions.find(
      (setting) =>
        setting.key ===
        settingKey
    );

  if (!settingDefinition) {
    return {
      allowed: false,
      reason:
        "UNKNOWN_SETTING",
    };
  }

  /*
   * Parent capability MUST be
   * enabled first.
   */
  const capabilityResult =
    await checkSiteCapability(
      siteId,
      featureKey
    );

  if (
    !capabilityResult.allowed
  ) {
    return capabilityResult;
  }

  const supabase =
    createSupabaseAdminClient();

  const {
    data: setting,
    error,
  } = await supabase
    .from(
      "module_settings"
    )
    .select(`
      enabled
    `)
    .eq(
      "site_id",
      siteId
    )
    .eq(
      "feature_key",
      featureKey
    )
    .eq(
      "setting_key",
      settingKey
    )
    .maybeSingle();

  if (error) {
    console.error(
      "LYNUX enforcement module lookup failed:",
      error.code
    );

    return {
      allowed: false,
      reason:
        "DATABASE_ERROR",
    };
  }

  /*
   * Missing sub-control row =
   * DENIED.
   *
   * Server enforcement never trusts
   * an unsaved frontend default.
   */
  if (
    !setting ||
    setting.enabled !== true
  ) {
    return {
      allowed: false,
      reason:
        "SETTING_DISABLED",
    };
  }

  return {
    allowed: true,
    siteId,
    capability:
      featureKey,
    setting:
      settingKey,
  };
}

/* =========================================================
   THROWING GUARDS
========================================================= */

export async function requireSiteCapability(
  siteId: string,
  featureKey: string
): Promise<void> {
  const result =
    await checkSiteCapability(
      siteId,
      featureKey
    );

  if (!result.allowed) {
    throw new Error(
      `LYNUX_ACCESS_DENIED:${result.reason}`
    );
  }
}

export async function requireModuleSetting(
  siteId: string,
  featureKey: string,
  settingKey: string
): Promise<void> {
  const result =
    await checkModuleSetting(
      siteId,
      featureKey,
      settingKey
    );

  if (!result.allowed) {
    throw new Error(
      `LYNUX_ACCESS_DENIED:${result.reason}`
    );
  }
}