export type ModuleSettingDefinition = {
  key: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
  danger?: boolean;
};

export type ModuleSettingsRegistry = Record<string, ModuleSettingDefinition[]>;

export const moduleSettingsRegistry: ModuleSettingsRegistry = {
  pages: [
    { key: "create", label: "Create pages", description: "Allow creation of new public pages.", defaultEnabled: false },
    { key: "edit", label: "Edit pages", description: "Allow editing existing page content.", defaultEnabled: true },
    { key: "delete", label: "Delete pages", description: "Allow permanent page deletion.", defaultEnabled: false, danger: true },
    { key: "publish", label: "Publish pages", description: "Allow publishing draft changes.", defaultEnabled: true },
    { key: "schedule", label: "Schedule publishing", description: "Allow future publish dates.", defaultEnabled: false }
  ],
  homepageEditor: [
    { key: "editText", label: "Edit homepage text", description: "Allow editing homepage copy.", defaultEnabled: true },
    { key: "editImages", label: "Edit homepage images", description: "Allow replacing homepage media.", defaultEnabled: true },
    { key: "addSections", label: "Add sections", description: "Allow inserting new homepage sections.", defaultEnabled: false },
    { key: "removeSections", label: "Remove sections", description: "Allow deleting homepage sections.", defaultEnabled: false, danger: true },
    { key: "reorderSections", label: "Reorder sections", description: "Allow changing homepage section order.", defaultEnabled: true }
  ],
  mediaLibrary: [
    { key: "upload", label: "Upload media", description: "Allow image and file uploads.", defaultEnabled: true },
    { key: "rename", label: "Rename media", description: "Allow file display-name changes.", defaultEnabled: true },
    { key: "replace", label: "Replace media", description: "Allow replacing an existing asset.", defaultEnabled: true },
    { key: "delete", label: "Delete media", description: "Allow permanent media deletion.", defaultEnabled: false, danger: true },
    { key: "bulkDelete", label: "Bulk delete", description: "Allow deleting multiple assets at once.", defaultEnabled: false, danger: true }
  ],
  products: [
    { key: "create", label: "Create products", description: "Allow adding new products.", defaultEnabled: true },
    { key: "edit", label: "Edit products", description: "Allow editing existing products.", defaultEnabled: true },
    { key: "delete", label: "Delete products", description: "Allow permanent product deletion.", defaultEnabled: false, danger: true },
    { key: "pricing", label: "Change pricing", description: "Allow price changes.", defaultEnabled: true },
    { key: "inventory", label: "Manage inventory", description: "Allow stock quantity changes.", defaultEnabled: true },
    { key: "categories", label: "Manage categories", description: "Allow category creation and editing.", defaultEnabled: true },
    { key: "variants", label: "Manage variants", description: "Allow size/color/style variant editing.", defaultEnabled: true },
    { key: "schedule", label: "Schedule products", description: "Allow scheduled product publishing.", defaultEnabled: false },
    { key: "bulkEdit", label: "Bulk edit products", description: "Allow changing multiple products at once.", defaultEnabled: false },
    { key: "archive", label: "Archive products", description: "Allow hiding products without deleting them.", defaultEnabled: true }
  ],
  diary: [
    { key: "create", label: "Create pages", description: "Allow creating new diary pages.", defaultEnabled: true },
    { key: "edit", label: "Edit pages", description: "Allow editing existing diary page content.", defaultEnabled: true },
    { key: "delete", label: "Delete pages", description: "Allow permanent diary page deletion.", defaultEnabled: false, danger: true },
    { key: "publish", label: "Publish pages", description: "Allow publishing and unpublishing diary pages.", defaultEnabled: true },
    { key: "duplicate", label: "Duplicate pages", description: "Allow duplicating an existing diary page into a new draft.", defaultEnabled: true },
    { key: "favorite", label: "Favorite pages", description: "Allow adding or removing diary pages from favorites.", defaultEnabled: true },
    { key: "tags", label: "Manage tags", description: "Allow adding, editing, and removing diary page tags.", defaultEnabled: true },
    { key: "layout", label: "Edit layout", description: "Allow moving diary decorations, photos, and layout elements.", defaultEnabled: true },
    { key: "history", label: "Version history", description: "Allow creating, viewing, and restoring diary page history.", defaultEnabled: true },
    { key: "autosave", label: "Autosave drafts", description: "Allow automatic saving of private diary drafts.", defaultEnabled: true }
  ],
  orders: [
    { key: "view", label: "View orders", description: "Allow viewing customer orders.", defaultEnabled: true },
    { key: "updateStatus", label: "Update order status", description: "Allow fulfillment/status changes.", defaultEnabled: true },
    { key: "refund", label: "Issue refunds", description: "Allow initiating refunds.", defaultEnabled: false, danger: true },
    { key: "cancel", label: "Cancel orders", description: "Allow order cancellation.", defaultEnabled: false, danger: true },
    { key: "customerData", label: "View customer details", description: "Allow access to customer order information.", defaultEnabled: true },
    { key: "export", label: "Export orders", description: "Allow order-data export.", defaultEnabled: false }
  ],
  adminUsers: [
    { key: "invite", label: "Invite admins", description: "Allow inviting new admin users.", defaultEnabled: false },
    { key: "editRoles", label: "Edit admin roles", description: "Allow changing other admins' permissions.", defaultEnabled: false, danger: true },
    { key: "suspend", label: "Suspend admins", description: "Allow temporarily disabling admin accounts.", defaultEnabled: false, danger: true },
    { key: "remove", label: "Remove admins", description: "Allow removing admin access.", defaultEnabled: false, danger: true }
  ],
  roles: [
    { key: "create", label: "Create roles", description: "Allow creation of custom roles.", defaultEnabled: false },
    { key: "edit", label: "Edit roles", description: "Allow modifying role permissions.", defaultEnabled: false, danger: true },
    { key: "delete", label: "Delete roles", description: "Allow removing custom roles.", defaultEnabled: false, danger: true },
    { key: "assign", label: "Assign roles", description: "Allow assigning roles to users.", defaultEnabled: false, danger: true }
  ],
  twoFactorAuth: [
    { key: "requiredOwners", label: "Require for owners", description: "Require 2FA for client owners.", defaultEnabled: true },
    { key: "requiredStaff", label: "Require for staff", description: "Require 2FA for staff accounts.", defaultEnabled: false },
    { key: "recoveryCodes", label: "Recovery codes", description: "Allow recovery-code generation.", defaultEnabled: true }
  ],
  sessionControls: [
    { key: "idleTimeout", label: "Idle timeout", description: "Expire inactive sessions.", defaultEnabled: true },
    { key: "revokeSessions", label: "Session revocation", description: "Allow owners to revoke active sessions.", defaultEnabled: true },
    { key: "singleSession", label: "Single-session mode", description: "Limit an account to one active session.", defaultEnabled: false }
  ],
  auditLog: [
    { key: "logAuth", label: "Log authentication", description: "Record login, logout, and failed login events.", defaultEnabled: true },
    { key: "logChanges", label: "Log content changes", description: "Record important create/edit/delete actions.", defaultEnabled: true },
    { key: "logExports", label: "Log exports", description: "Record data-export events.", defaultEnabled: true },
    { key: "tamperProtection", label: "Tamper protection", description: "Protect audit entries from normal admin editing.", defaultEnabled: true }
  ],
  featureFlags: [
    { key: "allowMasterToggle", label: "Master feature toggles", description: "Allow LYNUX master to enable/disable modules.", defaultEnabled: true },
    { key: "clientVisibility", label: "Client feature visibility", description: "Hide disabled modules from client navigation.", defaultEnabled: true },
    { key: "serverEnforcement", label: "Server enforcement", description: "Require server-side feature checks.", defaultEnabled: true }
  ],
  environmentSettings: [
    { key: "viewSafe", label: "View safe settings", description: "Allow viewing non-secret deployment values.", defaultEnabled: true },
    { key: "editSafe", label: "Edit safe settings", description: "Allow editing approved deployment values.", defaultEnabled: false },
    { key: "viewSecrets", label: "View secrets", description: "Never expose raw production secrets through the dashboard.", defaultEnabled: false, danger: true }
  ],
  clientProvisioning: [
    { key: "create", label: "Create client instance", description: "Provision a new isolated client admin.", defaultEnabled: true },
    { key: "clonePreset", label: "Clone preset", description: "Start a client from a saved configuration preset.", defaultEnabled: true },
    { key: "rotateKeys", label: "Rotate credentials", description: "Rotate client-specific service credentials.", defaultEnabled: true },
    { key: "decommission", label: "Decommission instance", description: "Disable and archive a client instance.", defaultEnabled: false, danger: true }
  ]
};

export function createDefaultModuleSettings(featureKey: string): Record<string, boolean> {
  const definitions = moduleSettingsRegistry[featureKey] ?? [];
  return Object.fromEntries(definitions.map((setting) => [setting.key, setting.defaultEnabled]));
}