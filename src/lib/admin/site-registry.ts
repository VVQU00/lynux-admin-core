import type { MasterSite } from "./types";

const now = new Date(0).toISOString();

export const masterSiteRegistry: MasterSite[] = [
  {
    id: "bluus-isle",
    name: "Bluu's Isle",
    slug: "bluus-isle",

    siteType: "commerce",
    environment: "development",

    domain: null,
    localUrl: null,

    connectionStatus: "not-configured",
    healthStatus: "unknown",

    coreEnabled: false,

    connector: {
      status: "not-installed",
      protocolVersion: "1.0.0",
      connectorVersion: "0.1.0",
      connectorId: null,
      lastAuthenticatedAt: null,
      lastHeartbeatAt: null,
      credentialVersion: 1,
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

    createdAt: now,
    updatedAt: now,
  },

  {
    id: "bluu-diary",
    name: "Bluu's Diary",
    slug: "bluu-diary",

    siteType: "diary",
    environment: "development",

    domain: null,
    localUrl: null,

    connectionStatus: "not-configured",
    healthStatus: "unknown",

    coreEnabled: false,

    connector: {
      status: "not-installed",
      protocolVersion: "1.0.0",
      connectorVersion: "0.1.0",
      connectorId: null,
      lastAuthenticatedAt: null,
      lastHeartbeatAt: null,
      credentialVersion: 1,
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

    createdAt: now,
    updatedAt: now,
  },

  {
    id: "island-mango-radio",
    name: "Island Mango Radio",
    slug: "island-mango-radio",

    siteType: "radio",
    environment: "development",

    domain: null,
    localUrl: null,

    connectionStatus: "not-configured",
    healthStatus: "unknown",

    coreEnabled: false,

    connector: {
      status: "not-installed",
      protocolVersion: "1.0.0",
      connectorVersion: "0.1.0",
      connectorId: null,
      lastAuthenticatedAt: null,
      lastHeartbeatAt: null,
      credentialVersion: 1,
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

    createdAt: now,
    updatedAt: now,
  },

  {
    id: "layers-of-hope-foundation",
    name: "Layers of Hope Foundation",
    slug: "layers-of-hope-foundation",

    siteType: "nonprofit",
    environment: "development",

    domain: null,
    localUrl: null,

    connectionStatus: "not-configured",
    healthStatus: "unknown",

    coreEnabled: false,

    connector: {
      status: "not-installed",
      protocolVersion: "1.0.0",
      connectorVersion: "0.1.0",
      connectorId: null,
      lastAuthenticatedAt: null,
      lastHeartbeatAt: null,
      credentialVersion: 1,
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

    createdAt: now,
    updatedAt: now,
  },
];

export function getMasterSite(siteId: string): MasterSite | null {
  return (
    masterSiteRegistry.find((site) => site.id === siteId) ??
    null
  );
}