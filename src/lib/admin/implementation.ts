import type { AdminImplementation } from "./types";

export function getAdminImplementation(): AdminImplementation {
  const value = process.env.LYNUX_ADMIN_IMPLEMENTATION;

  if (value === "client") return "client";
  return "master";
}
