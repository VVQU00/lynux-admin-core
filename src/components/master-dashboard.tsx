"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  signOutMasterAdmin,
} from "@/lib/admin/auth/actions";

import {
  ScannerReviewPanel,
} from "@/components/scanner-review-panel";

import {
  featureRegistry,
} from "@/lib/admin/feature-registry";

import {
  createDefaultFeatureConfig,
} from "@/lib/admin/default-features";

import {
  createDefaultModuleSettings,
  moduleSettingsRegistry,
} from "@/lib/admin/module-settings";

import type {
  ScannerReviewSession,
} from "@/lib/admin/scanner/types";

import type {
  AdminImplementation,
  FeatureCategory,
  FeatureConfig,
  MasterSite,
} from "@/lib/admin/types";

const categoryOrder: FeatureCategory[] = [
  "Core Website",
  "Commerce",
  "Services",
  "Content & Media",
  "Events",
  "Organizations",
  "Membership",
  "Education",
  "Real Estate",
  "Marketing",
  "Operations",
  "Security",
  "Developer",
];

type SiteFeatureState =
  Record<string, FeatureConfig>;

type ModuleState =
  Record<
    string,
    Record<
      string,
      Record<string, boolean>
    >
  >;

type ScannerSessionState =
  Record<
    string,
    ScannerReviewSession
  >;

type SaveState =
  | "idle"
  | "saving"
  | "saved"
  | "error";

export function MasterDashboard({
  implementation,
  sites,
  initialFeatureState,
  initialModuleState,
  initialScannerSessions = {},
}: {
  implementation: AdminImplementation;
  sites: MasterSite[];
  initialFeatureState: SiteFeatureState;
  initialModuleState: ModuleState;
  initialScannerSessions?: ScannerSessionState;
}) {
  const [
    selectedSiteId,
    setSelectedSiteId,
  ] = useState(
    sites[0]?.id ?? ""
  );

  const [
    siteFeatureState,
    setSiteFeatureState,
  ] = useState<SiteFeatureState>(
    initialFeatureState
  );

  const [
    moduleState,
    setModuleState,
  ] = useState<ModuleState>(
    initialModuleState
  );

  const [
    activeCategory,
    setActiveCategory,
  ] = useState<FeatureCategory>(
    "Core Website"
  );

  const [
    selectedFeatureKey,
    setSelectedFeatureKey,
  ] = useState<string | null>(
    null
  );

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    saveState,
    setSaveState,
  ] = useState<SaveState>(
    "idle"
  );

  /* =========================================================
     CURRENT SITE
  ========================================================= */

  const selectedSite =
    sites.find(
      (site) =>
        site.id === selectedSiteId
    ) ?? null;

  const selectedScannerSession =
    selectedSiteId
      ? initialScannerSessions[
          selectedSiteId
        ] ?? null
      : null;

  const features =
    selectedSiteId
      ? siteFeatureState[
          selectedSiteId
        ] ??
        createDefaultFeatureConfig()
      : createDefaultFeatureConfig();

  /* =========================================================
     REGISTRY
  ========================================================= */

  const visibleRegistry =
    useMemo(
      () =>
        featureRegistry.filter(
          (feature) =>
            !(
              feature.masterOnly &&
              implementation !==
                "master"
            )
        ),
      [implementation]
    );

  const filteredRegistry =
    useMemo(() => {
      const q =
        query
          .trim()
          .toLowerCase();

      if (!q) {
        return visibleRegistry.filter(
          (feature) =>
            feature.category ===
            activeCategory
        );
      }

      return visibleRegistry.filter(
        (feature) =>
          feature.label
            .toLowerCase()
            .includes(q) ||
          feature.description
            .toLowerCase()
            .includes(q) ||
          feature.category
            .toLowerCase()
            .includes(q) ||
          feature.key
            .toLowerCase()
            .includes(q)
      );
    }, [
      query,
      visibleRegistry,
      activeCategory,
    ]);

  const enabledCount =
    visibleRegistry.filter(
      (feature) =>
        features[
          feature.key
        ]
    ).length;

  /* =========================================================
     DRAWER
  ========================================================= */

  const selectedFeature =
    selectedFeatureKey
      ? visibleRegistry.find(
          (feature) =>
            feature.key ===
            selectedFeatureKey
        ) ?? null
      : null;

  const selectedSettings =
    selectedFeature
      ? moduleSettingsRegistry[
          selectedFeature.key
        ] ?? []
      : [];

  /* =========================================================
     SITE SELECTION
  ========================================================= */

  function selectSite(
    siteId: string
  ) {
    setSelectedSiteId(
      siteId
    );

    setSelectedFeatureKey(
      null
    );

    setQuery("");

    setActiveCategory(
      "Core Website"
    );

    setSaveState(
      "idle"
    );
  }

  /* =========================================================
     MAIN FEATURE TOGGLE
  ========================================================= */

  async function toggleFeature(
    featureKey: string
  ) {
    if (!selectedSiteId) {
      return;
    }

    const currentSiteState =
      siteFeatureState[
        selectedSiteId
      ] ??
      createDefaultFeatureConfig();

    const previousValue =
      currentSiteState[
        featureKey
      ] === true;

    const nextValue =
      !previousValue;

    setSiteFeatureState(
      (current) => ({
        ...current,

        [selectedSiteId]: {
          ...(
            current[
              selectedSiteId
            ] ??
            createDefaultFeatureConfig()
          ),

          [featureKey]:
            nextValue,
        },
      })
    );

    setSaveState(
      "saving"
    );

    try {
      const response =
        await fetch(
          "/api/admin/site-capabilities",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                siteId:
                  selectedSiteId,

                featureKey,

                enabled:
                  nextValue,
              }),
          }
        );

      if (
        !response.ok
      ) {
        throw new Error();
      }

      setSaveState(
        "saved"
      );
    } catch {
      setSiteFeatureState(
        (current) => ({
          ...current,

          [selectedSiteId]: {
            ...(
              current[
                selectedSiteId
              ] ??
              createDefaultFeatureConfig()
            ),

            [featureKey]:
              previousValue,
          },
        })
      );

      setSaveState(
        "error"
      );
    }
  }

  /* =========================================================
     OPEN MODULE
  ========================================================= */

  function openFeature(
    key: string
  ) {
    if (!selectedSiteId) {
      return;
    }

    setSelectedFeatureKey(
      key
    );
  }

  /* =========================================================
     MODULE SETTING VALUE
  ========================================================= */

  function getModuleSetting(
    featureKey: string,
    settingKey: string
  ) {
    if (!selectedSiteId) {
      return false;
    }

    const savedValue =
      moduleState[
        selectedSiteId
      ]?.[
        featureKey
      ]?.[
        settingKey
      ];

    if (
      typeof savedValue ===
      "boolean"
    ) {
      return savedValue;
    }

    const defaults =
      createDefaultModuleSettings(
        featureKey
      );

    return (
      defaults[
        settingKey
      ] === true
    );
  }

  /* =========================================================
     MODULE SETTING TOGGLE
  ========================================================= */

  async function toggleModuleSetting(
    featureKey: string,
    settingKey: string
  ) {
    if (!selectedSiteId) {
      return;
    }

    const previousValue =
      getModuleSetting(
        featureKey,
        settingKey
      );

    const nextValue =
      !previousValue;

    setModuleState(
      (current) => ({
        ...current,

        [selectedSiteId]: {
          ...(
            current[
              selectedSiteId
            ] ?? {}
          ),

          [featureKey]: {
            ...(
              current[
                selectedSiteId
              ]?.[
                featureKey
              ] ?? {}
            ),

            [settingKey]:
              nextValue,
          },
        },
      })
    );

    setSaveState(
      "saving"
    );

    try {
      const response =
        await fetch(
          "/api/admin/module-settings",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                siteId:
                  selectedSiteId,

                featureKey,

                settingKey,

                enabled:
                  nextValue,
              }),
          }
        );

      if (
        !response.ok
      ) {
        throw new Error();
      }

      setSaveState(
        "saved"
      );
    } catch {
      setModuleState(
        (current) => ({
          ...current,

          [selectedSiteId]: {
            ...(
              current[
                selectedSiteId
              ] ?? {}
            ),

            [featureKey]: {
              ...(
                current[
                  selectedSiteId
                ]?.[
                  featureKey
                ] ?? {}
              ),

              [settingKey]:
                previousValue,
            },
          },
        })
      );

      setSaveState(
        "error"
      );
    }
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">
            LYNUX / System 01
          </div>

          <h1>
            ADMIN
            <br />
            CORE
          </h1>
        </div>

        <nav>
          {categoryOrder.map(
            (category) => {
              const count =
                visibleRegistry.filter(
                  (feature) =>
                    feature.category ===
                    category
                ).length;

              if (!count) {
                return null;
              }

              return (
                <button
                  key={
                    category
                  }
                  className={`navItem ${
                    activeCategory ===
                    category
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    setActiveCategory(
                      category
                    );

                    setQuery("");
                  }}
                >
                  <span>
                    {category}
                  </span>

                  <span className="count">
                    {count}
                  </span>
                </button>
              );
            }
          )}
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              Private configuration
              layer
            </p>

            <h2>
              Master Site Control
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div className="mode">
              implementation /{" "}
              <strong>
                {implementation}
              </strong>
            </div>

            <form action={signOutMasterAdmin}>
              <button
                type="submit"
                className="mode"
                style={{
                  cursor: "pointer",
                  background: "transparent",
                  font: "inherit",
                }}
              >
                SIGN OUT
              </button>
            </form>
          </div>
        </header>

        <div className="workspace">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">
                Master Site Registry
              </p>

              <h3>
                Connected Properties
              </h3>
            </div>

            <p>
              Every site is isolated.
              Select a property to
              control its capabilities.
            </p>
          </div>

          <div className="featureTable">
            {sites.map(
              (site) => {
                const isSelected =
                  site.id ===
                  selectedSiteId;

                const siteFeatures =
                  siteFeatureState[
                    site.id
                  ] ??
                  createDefaultFeatureConfig();

                const siteEnabledCount =
                  visibleRegistry.filter(
                    (feature) =>
                      siteFeatures[
                        feature.key
                      ]
                  ).length;

                return (
                  <div
                    key={
                      site.id
                    }
                    className={`featureRow featureRowClickable ${
                      isSelected
                        ? "active"
                        : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="featureOpen"
                      onClick={() =>
                        selectSite(
                          site.id
                        )
                      }
                    >
                      <span className="featureName">
                        {
                          site.name
                        }
                      </span>

                      <span className="featureDesc">
                        {
                          site.siteType
                        }{" "}
                        /{" "}
                        {
                          site.environment
                        }
                      </span>

                      <span className="featureMeta">
                        {
                          siteEnabledCount
                        }{" "}
                        enabled controls
                      </span>

                      <span className="arrow">
                        →
                      </span>
                    </button>

                    <div className="featureControl">
                      <span
                        style={{
                          fontSize:
                            "10px",

                          textTransform:
                            "uppercase",

                          letterSpacing:
                            "0.12em",

                          opacity:
                            isSelected
                              ? 1
                              : 0.4,
                        }}
                      >
                        {isSelected
                          ? "ACTIVE"
                          : site.connectionStatus}
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {selectedSite && (
            <>
              <div className="summaryGrid">
                <div className="metric">
                  <div className="metricLabel">
                    Selected Site
                  </div>

                  <div className="metricValue smallMetric">
                    {
                      selectedSite.name
                    }
                  </div>
                </div>

                <div className="metric">
                  <div className="metricLabel">
                    Enabled
                  </div>

                  <div className="metricValue">
                    {
                      enabledCount
                    }
                  </div>
                </div>

                <div className="metric">
                  <div className="metricLabel">
                    Disabled
                  </div>

                  <div className="metricValue">
                    {
                      visibleRegistry.length -
                      enabledCount
                    }
                  </div>
                </div>

                <div className="metric">
                  <div className="metricLabel">
                    Database
                  </div>

                  <div className="metricValue smallMetric">
                    {saveState ===
                    "saving"
                      ? "saving"
                      : saveState ===
                          "error"
                        ? "error"
                        : "connected"}
                  </div>
                </div>
              </div>

              <ScannerReviewPanel
                siteId={
                  selectedSite.id
                }
                session={
                  selectedScannerSession
                }
              />

              <div className="searchStrip">
                <span className="searchLabel">
                  SEARCH /
                </span>

                <input
                  value={
                    query
                  }
                  onChange={(
                    event
                  ) =>
                    setQuery(
                      event.target
                        .value
                    )
                  }
                  placeholder="products, security, pages, orders..."
                />

                {query && (
                  <button
                    type="button"
                    onClick={() =>
                      setQuery("")
                    }
                  >
                    CLEAR
                  </button>
                )}
              </div>

              <div className="sectionHeader">
                <div>
                  <p className="eyebrow">
                    {
                      selectedSite.name
                    }
                  </p>

                  <h3>
                    {query
                      ? `Search results / ${filteredRegistry.length}`
                      : activeCategory}
                  </h3>
                </div>

                <p>
                  These controls belong
                  only to this site's
                  security bubble.
                </p>
              </div>

              <div className="featureTable">
                {filteredRegistry.map(
                  (feature) => {
                    const controls =
                      moduleSettingsRegistry[
                        feature.key
                      ] ?? [];

                    return (
                      <div
                        className="featureRow featureRowClickable"
                        key={
                          feature.key
                        }
                      >
                        <button
                          className="featureOpen"
                          type="button"
                          onClick={() =>
                            openFeature(
                              feature.key
                            )
                          }
                        >
                          <span className="featureName">
                            {
                              feature.label
                            }
                          </span>

                          <span className="featureDesc">
                            {
                              feature.description
                            }
                          </span>

                          <span className="featureMeta">
                            {controls.length
                              ? `${controls.length} controls`
                              : "module controls coming"}
                          </span>

                          <span className="arrow">
                            →
                          </span>
                        </button>

                        <div className="featureControl">
                          <button
                            type="button"
                            aria-pressed={
                              features[
                                feature.key
                              ]
                            }
                            onClick={() =>
                              toggleFeature(
                                feature.key
                              )
                            }
                            className={`switch ${
                              features[
                                feature.key
                              ]
                                ? "on"
                                : ""
                            }`}
                          >
                            <div className="switchKnob" />
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <div className="notice">
                Main capability
                switches and module
                sub-controls now
                persist independently
                for each website.
              </div>
            </>
          )}
        </div>
      </section>

      {selectedFeature &&
        selectedSite && (
          <div
            className="drawerBackdrop"
            onClick={() =>
              setSelectedFeatureKey(
                null
              )
            }
          >
            <aside
              className="drawer"
              onClick={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="drawerTop">
                <div>
                  <p className="eyebrow">
                    {
                      selectedSite.name
                    }
                  </p>

                  <h3>
                    {
                      selectedFeature.label
                    }
                  </h3>
                </div>

                <button
                  className="closeButton"
                  type="button"
                  onClick={() =>
                    setSelectedFeatureKey(
                      null
                    )
                  }
                >
                  CLOSE ×
                </button>
              </div>

              <div className="moduleMaster">
                <div>
                  <span className="moduleMasterLabel">
                    MODULE STATUS
                  </span>

                  <strong>
                    {features[
                      selectedFeature.key
                    ]
                      ? "ENABLED"
                      : "DISABLED"}
                  </strong>
                </div>

                <button
                  type="button"
                  aria-pressed={
                    features[
                      selectedFeature.key
                    ]
                  }
                  onClick={() =>
                    toggleFeature(
                      selectedFeature.key
                    )
                  }
                  className={`switch largeSwitch ${
                    features[
                      selectedFeature.key
                    ]
                      ? "on"
                      : ""
                  }`}
                >
                  <div className="switchKnob" />
                </button>
              </div>

              {!features[
                selectedFeature.key
              ] && (
                <div className="disabledBanner">
                  This module is
                  disabled for{" "}
                  {
                    selectedSite.name
                  }.
                  Its sub-settings stay
                  saved, but they must
                  not grant access while
                  the master module is
                  disabled.
                </div>
              )}

              <div className="drawerSectionLabel">
                MODULE /
                SUB-CONTROLS
              </div>

              {selectedSettings.length ? (
                <div className="permissionList">
                  {selectedSettings.map(
                    (setting) => {
                      const enabled =
                        getModuleSetting(
                          selectedFeature.key,
                          setting.key
                        );

                      return (
                        <div
                          className={`permissionRow ${
                            setting.danger
                              ? "dangerRow"
                              : ""
                          }`}
                          key={
                            setting.key
                          }
                        >
                          <div>
                            <strong>
                              {
                                setting.label
                              }
                            </strong>

                            <p>
                              {
                                setting.description
                              }
                            </p>

                            {setting.danger && (
                              <span className="dangerTag">
                                DESTRUCTIVE
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            aria-pressed={
                              enabled
                            }
                            onClick={() =>
                              toggleModuleSetting(
                                selectedFeature.key,
                                setting.key
                              )
                            }
                            className={`switch ${
                              enabled
                                ? "on"
                                : ""
                            }`}
                          >
                            <div className="switchKnob" />
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="emptySettings">
                  <strong>
                    No deeper controls
                    defined yet.
                  </strong>

                  <p>
                    This module still
                    has its master
                    capability switch.
                  </p>
                </div>
              )}

              <div className="drawerFooter">
                <span>
                  {
                    selectedFeature.key
                  }
                </span>

                <span>
                  {
                    selectedFeature.category
                  }
                </span>
              </div>
            </aside>
          </div>
        )}
    </div>
  );
}