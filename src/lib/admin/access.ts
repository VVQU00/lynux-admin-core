import { featureRegistry } from "./feature-registry";
import type { AdminImplementation, FeatureConfig } from "./types";

export function isFeatureEnabled(
  featureKey: string,
  features: FeatureConfig,
  implementation: AdminImplementation
): boolean {
  const definition = featureRegistry.find((feature) => feature.key === featureKey);

  if (!definition) return false;
  if (definition.masterOnly && implementation !== "master") return false;

  return features[featureKey] === true;
}

export function requireFeature(
  featureKey: string,
  features: FeatureConfig,
  implementation: AdminImplementation
): void {
  if (!isFeatureEnabled(featureKey, features, implementation)) {
    throw new Error(`Feature "${featureKey}" is disabled or unavailable.`);
  }
}
