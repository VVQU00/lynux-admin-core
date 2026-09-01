import "server-only";

import {
  createHash,
  timingSafeEqual,
} from "node:crypto";

import type {
  NextRequest,
} from "next/server";

import {
  createSupabaseAdminClient,
} from "@/lib/admin/supabase/server";

export type ConnectorAuthResult =
  | {
      authenticated: true;
      siteId: string;
      connectorId: string;
      protocolVersion: string;
      connectorVersion: string;
    }
  | {
      authenticated: false;
      reason:
        | "MISSING_CONNECTOR_ID"
        | "MISSING_SECRET"
        | "CONNECTOR_NOT_FOUND"
        | "CONNECTOR_INACTIVE"
        | "CONNECTOR_REVOKED"
        | "INVALID_SECRET"
        | "SITE_NOT_FOUND"
        | "SITE_BLOCKED"
        | "DATABASE_ERROR";
    };

export function hashConnectorSecret(
  secret: string
): string {
  return createHash("sha256")
    .update(secret, "utf8")
    .digest("hex");
}

function safeHashCompare(
  candidateHash: string,
  storedHash: string
): boolean {
  try {
    const candidateBuffer =
      Buffer.from(candidateHash, "hex");

    const storedBuffer =
      Buffer.from(storedHash, "hex");

    if (
      candidateBuffer.length === 0 ||
      storedBuffer.length === 0
    ) {
      return false;
    }

    if (
      candidateBuffer.length !==
      storedBuffer.length
    ) {
      return false;
    }

    return timingSafeEqual(
      candidateBuffer,
      storedBuffer
    );
  } catch {
    return false;
  }
}

function getConnectorId(
  request: NextRequest
): string | null {
  const value =
    request.headers
      .get("x-lynux-connector-id")
      ?.trim();

  return value || null;
}

function getBearerSecret(
  request: NextRequest
): string | null {
  const authorization =
    request.headers
      .get("authorization")
      ?.trim();

  if (!authorization) {
    return null;
  }

  const match =
    authorization.match(
      /^Bearer\s+(.+)$/i
    );

  if (!match) {
    return null;
  }

  const secret =
    match[1]?.trim();

  return secret || null;
}

export async function authenticateSiteConnector(
  request: NextRequest
): Promise<ConnectorAuthResult> {
  const connectorId =
    getConnectorId(request);

  if (!connectorId) {
    return {
      authenticated: false,
      reason: "MISSING_CONNECTOR_ID",
    };
  }

  const secret =
    getBearerSecret(request);

  if (!secret) {
    return {
      authenticated: false,
      reason: "MISSING_SECRET",
    };
  }

  const supabase =
    createSupabaseAdminClient();

  const {
    data: connector,
    error: connectorError,
  } = await supabase
    .from("site_connectors")
    .select(`
      site_id,
      connector_id,
      status,
      protocol_version,
      connector_version,
      secret_hash,
      revoked_at
    `)
    .eq(
      "connector_id",
      connectorId
    )
    .maybeSingle();

  if (connectorError) {
    console.error(
      "LYNUX connector lookup failed:",
      connectorError.code
    );

    return {
      authenticated: false,
      reason: "DATABASE_ERROR",
    };
  }

  if (!connector) {
    return {
      authenticated: false,
      reason: "CONNECTOR_NOT_FOUND",
    };
  }

  if (
    connector.revoked_at !== null ||
    connector.status === "revoked"
  ) {
    return {
      authenticated: false,
      reason: "CONNECTOR_REVOKED",
    };
  }

  if (
    connector.status !== "active"
  ) {
    return {
      authenticated: false,
      reason: "CONNECTOR_INACTIVE",
    };
  }

  if (!connector.secret_hash) {
    return {
      authenticated: false,
      reason: "INVALID_SECRET",
    };
  }

  const candidateHash =
    hashConnectorSecret(secret);

  const secretMatches =
    safeHashCompare(
      candidateHash,
      connector.secret_hash
    );

  if (!secretMatches) {
    return {
      authenticated: false,
      reason: "INVALID_SECRET",
    };
  }

  const {
    data: site,
    error: siteError,
  } = await supabase
    .from("sites")
    .select(`
      id,
      connection_status
    `)
    .eq(
      "id",
      connector.site_id
    )
    .maybeSingle();

  if (siteError) {
    console.error(
      "LYNUX connector site lookup failed:",
      siteError.code
    );

    return {
      authenticated: false,
      reason: "DATABASE_ERROR",
    };
  }

  if (!site) {
    return {
      authenticated: false,
      reason: "SITE_NOT_FOUND",
    };
  }

  if (
    site.connection_status === "suspended" ||
    site.connection_status === "revoked"
  ) {
    return {
      authenticated: false,
      reason: "SITE_BLOCKED",
    };
  }

  const now =
    new Date().toISOString();

  const {
    error: updateError,
  } = await supabase
    .from("site_connectors")
    .update({
      last_authenticated_at: now,
    })
    .eq(
      "connector_id",
      connectorId
    );

  if (updateError) {
    console.error(
      "LYNUX connector authentication timestamp failed:",
      updateError.code
    );
  }

  return {
    authenticated: true,
    siteId: connector.site_id,
    connectorId: connector.connector_id,
    protocolVersion:
      connector.protocol_version,
    connectorVersion:
      connector.connector_version,
  };
}

export async function requireSiteConnector(
  request: NextRequest
): Promise<{
  siteId: string;
  connectorId: string;
  protocolVersion: string;
  connectorVersion: string;
}> {
  const result =
    await authenticateSiteConnector(
      request
    );

  if (!result.authenticated) {
    throw new Error(
      `LYNUX_CONNECTOR_DENIED:${result.reason}`
    );
  }

  return {
    siteId: result.siteId,
    connectorId:
      result.connectorId,
    protocolVersion:
      result.protocolVersion,
    connectorVersion:
      result.connectorVersion,
  };
}