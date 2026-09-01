import { featureRegistry } from "./feature-registry";
import type { FeatureConfig } from "./types";

export function createDefaultFeatureConfig(): FeatureConfig {
  return Object.fromEntries(
    featureRegistry.map((feature) => [feature.key, feature.defaultEnabled])
  );
}
