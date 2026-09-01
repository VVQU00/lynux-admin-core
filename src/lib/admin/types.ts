export type AdminImplementation = "master" | "client";

export type FeatureCategory =
  | "Core Website"
  | "Commerce"
  | "Services"
  | "Content & Media"
  | "Events"
  | "Organizations"
  | "Membership"
  | "Education"
  | "Real Estate"
  | "Marketing"
  | "Operations"
  | "Security"
  | "Developer";

export type FeatureDefinition = {
  key: string;
  label: string;
  description: string;
  category: FeatureCategory;
  defaultEnabled: boolean;
  masterOnly?: boolean;
};

export type FeatureConfig = Record<string, boolean>;

export type ClientProfile = {
  id: string;
  name: string;
  slug: string;
  features: FeatureConfig;
};

/* =========================================================
   LYNUX MASTER CORE — SITE REGISTRY
========================================================= */

export type SiteType =
  | "business"
  | "commerce"
  | "diary"
  | "radio"
  | "nonprofit"
  | "portfolio"
  | "media"
  | "custom";

export type SiteEnvironment =
  | "development"
  | "staging"
  | "production";

export type SiteConnectionStatus =
  | "not-configured"
  | "ready"
  | "connecting"
  | "connected"
  | "scanning"
  | "degraded"
  | "error"
  | "suspended"
  | "revoked"
  | "disconnected";

export type SiteHealthStatus =
  | "unknown"
  | "healthy"
  | "warning"
  | "critical";

export type ConnectorStatus =
  | "not-installed"
  | "inactive"
  | "active"
  | "expired"
  | "revoked"
  | "error";

export type ScanStatus =
  | "never"
  | "queued"
  | "running"
  | "complete"
  | "failed";

export type CapabilityConfidence =
  | "verified"
  | "probable"
  | "possible"
  | "conflict"
  | "unsupported";

export type SiteCapability = {
  key: string;
  detected: boolean;
  approved: boolean;
  enabled: boolean;

  confidence: CapabilityConfidence;
  confidenceScore: number;

  detectedFrom: Array<
    | "manifest"
    | "registry"
    | "api"
    | "database"
    | "route"
    | "component"
    | "manual"
  >;

  lastVerifiedAt: string | null;
};

export type SiteConnector = {
  status: ConnectorStatus;

  protocolVersion: string;
  connectorVersion: string;

  connectorId: string | null;

  lastAuthenticatedAt: string | null;
  lastHeartbeatAt: string | null;

  credentialVersion: number;

  /*
   * NEVER place connector secrets here.
   * This object may eventually be sent to UI code.
   * Raw credentials remain server-side only.
   */
};

export type SiteScanState = {
  status: ScanStatus;

  lastScanAt: string | null;
  lastSuccessfulScanAt: string | null;

  detectedCapabilities: number;
  approvedCapabilities: number;

  error: string | null;
};

export type MasterSite = {
  id: string;

  name: string;
  slug: string;

  siteType: SiteType;
  environment: SiteEnvironment;

  domain: string | null;
  localUrl: string | null;

  connectionStatus: SiteConnectionStatus;
  healthStatus: SiteHealthStatus;

  coreEnabled: boolean;

  connector: SiteConnector;
  scan: SiteScanState;

  capabilities: SiteCapability[];

  createdAt: string;
  updatedAt: string;
};