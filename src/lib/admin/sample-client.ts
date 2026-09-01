import { createDefaultFeatureConfig } from "./default-features";
import type { ClientProfile } from "./types";

const features = createDefaultFeatureConfig();

export const sampleClient: ClientProfile = {
  id: "demo-client-001",
  name: "Starter Client",
  slug: "starter-client",
  features,
};
