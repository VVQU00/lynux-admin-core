import "server-only";

import {
  randomBytes,
  randomUUID,
} from "node:crypto";

import {
  createSupabaseAdminClient,
} from "@/lib/admin/supabase/server";

import {
  hashConnectorSecret,
} from "@/lib/admin/connector-auth";

type ProvisionConnectorResult = {
  siteId: string;
  connectorId: string;
  secret: string;
  protocolVersion: string;
  connectorVersion: string;
};

export async function provisionSiteConnector(
  siteId: string
): Promise<ProvisionConnectorResult> {
  const supabase =
    createSupabaseAdminClient();

  const {
    data: site,
    error: siteError,
  } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .maybeSingle();

  if (siteError) {
    throw new Error(
      `Unable to verify site: ${siteError.message}`
    );
  }

  if (!site) {
    throw new Error(
      `Site "${siteId}" does not exist.`
    );
  }

  const connectorId =
    `lynux_${randomUUID()}`;

  const secret =
    randomBytes(32).toString("hex");

  const secretHash =
    hashConnectorSecret(secret);

  const protocolVersion =
    "1.0.0";

  const connectorVersion =
    "0.1.0";

  const now =
    new Date().toISOString();

  /*
   * Check whether this site already has
   * a connector record.
   */
  const {
    data: existingConnector,
    error: lookupError,
  } = await supabase
    .from("site_connectors")
    .select("site_id")
    .eq("site_id", siteId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(
      `Unable to check existing connector: ${lookupError.message}`
    );
  }

  if (existingConnector) {
    /*
     * Rotate the existing connector instead
     * of inserting a duplicate site row.
     */
    const {
      error: updateError,
    } = await supabase
      .from("site_connectors")
      .update({
        connector_id:
          connectorId,

        status: "active",

        protocol_version:
          protocolVersion,

        connector_version:
          connectorVersion,

        secret_hash:
          secretHash,

        revoked_at: null,

        last_authenticated_at:
          null,

        updated_at:
          now,
      })
      .eq("site_id", siteId);

    if (updateError) {
      throw new Error(
        `Unable to rotate connector: ${updateError.message}`
      );
    }
  } else {
    /*
     * First connector ever issued
     * for this site.
     */
    const {
      error: insertError,
    } = await supabase
      .from("site_connectors")
      .insert({
        site_id:
          siteId,

        connector_id:
          connectorId,

        status:
          "active",

        protocol_version:
          protocolVersion,

        connector_version:
          connectorVersion,

        secret_hash:
          secretHash,

        revoked_at:
          null,

        last_authenticated_at:
          null,

        created_at:
          now,

        updated_at:
          now,
      });

    if (insertError) {
      throw new Error(
        `Unable to create connector: ${insertError.message}`
      );
    }
  }

  const {
    error: siteUpdateError,
  } = await supabase
    .from("sites")
    .update({
      connection_status:
        "ready",

      updated_at:
        now,
    })
    .eq("id", siteId);

  if (siteUpdateError) {
    throw new Error(
      `Connector created, but site status could not be updated: ${siteUpdateError.message}`
    );
  }

  return {
    siteId,
    connectorId,
    secret,
    protocolVersion,
    connectorVersion,
  };
}