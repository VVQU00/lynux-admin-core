import type { CanonicalAction } from "./types";

/* =========================================================
   LYNUX SCANNER V1 — CANONICAL LANGUAGE

   Purpose:
   Translate inconsistent local project terminology into
   universal LYNUX capability/action language.

   Scanner v1 is intentionally conservative.

   Generic programming words are NOT trusted by themselves.

   IMPORTANT:
   These mappings are discovery hints only.
   They NEVER approve or enforce capabilities.
========================================================= */

export type CanonicalCapabilityLanguage = {
  capabilityKey: string;

  label: string;

  aliases: string[];

  strongSignals?: string[];

  actions: CanonicalAction[];
};

/* =========================================================
   UNIVERSAL CAPABILITY LANGUAGE
========================================================= */

export const canonicalCapabilityLanguage:
  CanonicalCapabilityLanguage[] = [
  /* =======================================================
     CORE WEBSITE
  ======================================================= */

  {
    capabilityKey: "pages",

    label: "Pages",

    aliases: [
      "content pages",
      "site pages",
      "website pages",
      "cms pages",
      "cms page",
      "managed pages",
      "managed page",
      "website content pages",
      "site content pages",
    ],

    strongSignals: [
      "site_pages",
      "website_pages",
      "cms_pages",
      "managed_pages",
      "site_page_id",
      "website_page_id",
      "cms_page_id",
      "page_slug",
      "page_status",
    ],

    actions: [
      "create",
      "read",
      "update",
      "delete",
      "publish",
      "unpublish",
      "schedule",
      "manage",
    ],
  },

  {
    capabilityKey: "homepageEditor",

    label: "Homepage Editor",

    aliases: [
      "homepage",
      "homepage content",
      "home content",
      "hero content",
      "homepage settings",
      "home settings",
      "landing content",
      "landing settings",
    ],

    strongSignals: [
      "hero_title",
      "hero_subtitle",
      "homepage_content",
      "homepage_settings",
      "home_content",
    ],

    actions: [
      "read",
      "update",
      "publish",
      "manage",
    ],
  },

  {
    capabilityKey: "navigation",

    label: "Navigation",

    aliases: [
      "navigation",
      "navbar",
      "nav items",
      "nav links",
      "menu items",
      "menu links",
      "navigation links",
      "navigation items",
      "mobile nav",
      "mobile navigation",
    ],

    strongSignals: [
      "nav_items",
      "navigation_items",
      "menu_items",
      "navigation_links",
      "menu_links",
      "sort_order",
    ],

    actions: [
      "create",
      "read",
      "update",
      "delete",
      "manage",
    ],
  },

  /* =======================================================
     COMMERCE
  ======================================================= */

  {
    capabilityKey: "products",

    label: "Products",

    aliases: [
      "product",
      "products",
      "product item",
      "product items",
      "product listing",
      "product listings",
      "merchandise",
      "inventory product",
      "inventory products",
      "catalog item",
      "catalog items",
      "shop item",
      "shop items",
    ],

    strongSignals: [
      "product_id",
      "productid",
      "product_inventory",
      "product_status",
      "product_category",
      "product_price",
      "sku",
      "variants",
      "variant_id",
    ],

    actions: [
      "create",
      "read",
      "update",
      "delete",
      "publish",
      "unpublish",
      "archive",
      "restore",
      "manage",
    ],
  },

  {
    capabilityKey: "orders",

    label: "Orders",

    /*
     * IMPORTANT:
     *
     * Do NOT use singular "order" as a general alias.
     *
     * Generic programming terminology such as:
     *
     * DAY_ORDER
     * sortOrder
     * displayOrder
     * menuOrder
     *
     * describes sequencing, not commerce.
     *
     * Real commerce systems will still provide stronger
     * signals such as:
     *
     * orders
     * checkout
     * order_id
     * order_status
     * shop_orders
     */
    aliases: [
      "orders",
      "purchase",
      "purchases",
      "checkout",
      "checkout record",
      "checkout records",
      "shop order",
      "shop orders",
      "sales order",
      "sales orders",
    ],

    strongSignals: [
      "order_id",
      "orderid",
      "order_number",
      "order_status",
      "order_items",
      "shop_order",
      "shop_orders",
      "checkout_session",
      "checkout_items",
      "payment_status",
      "fulfillment_status",
      "customer_id",
    ],

    actions: [
      "create",
      "read",
      "update",
      "fulfill",
      "refund",
      "cancel",
      "archive",
      "manage",
    ],
  },

  {
    capabilityKey: "customers",

    label: "Customers",

    aliases: [
      "customer",
      "customers",
      "buyer",
      "buyers",
      "shopper",
      "shoppers",
      "customer profile",
      "customer profiles",
      "customer account",
      "customer accounts",
    ],

    strongSignals: [
      "customer_id",
      "customerid",
      "customer_email",
      "customer_name",
      "customer_profile",
      "billing_address",
      "shipping_address",
    ],

    actions: [
      "create",
      "read",
      "update",
      "delete",
      "archive",
      "manage",
    ],
  },

  {
    capabilityKey: "inventory",

    label: "Inventory",

    aliases: [
      "inventory",
      "inventory stock",
      "stock levels",
      "stock level",
      "product inventory",
      "warehouse inventory",
    ],

    strongSignals: [
      "product_inventory",
      "inventory_id",
      "quantity_available",
      "quantity_on_hand",
      "stock_count",
      "inventory_count",
      "warehouse_id",
    ],

    actions: [
      "read",
      "update",
      "manage",
    ],
  },

  /* =======================================================
     SERVICES / COMMUNICATION
  ======================================================= */

  {
    capabilityKey: "inquiries",

    label: "Inquiries",

    aliases: [
      "inquiry",
      "inquiries",
      "custom inquiry",
      "custom inquiries",
      "contact request",
      "contact requests",
      "contact submission",
      "contact submissions",
      "customer inquiry",
      "customer inquiries",
      "lead inquiry",
      "lead inquiries",
    ],

    strongSignals: [
      "inquiry_id",
      "custom_inquiries",
      "contact_form",
      "contact_message",
      "contact_submission",
      "inquiry_status",
      "inquiry_type",
      "submitted_at",
    ],

    actions: [
      "create",
      "read",
      "update",
      "archive",
      "send",
      "manage",
    ],
  },

  {
    capabilityKey: "appointments",

    label: "Appointments",

    aliases: [
      "appointment",
      "appointments",
      "booking",
      "bookings",
      "reservation",
      "reservations",
      "service booking",
      "service bookings",
      "scheduled service",
      "scheduled services",
    ],

    strongSignals: [
      "appointment_id",
      "booking_id",
      "reservation_id",
      "scheduled_at",
      "appointment_date",
      "appointment_time",
    ],

    actions: [
      "create",
      "read",
      "update",
      "approve",
      "reject",
      "cancel",
      "schedule",
      "manage",
    ],
  },

  /* =======================================================
     CONTENT
  ======================================================= */

  {
    capabilityKey: "posts",

    label: "Posts",

    aliases: [
      "posts",
      "blog",
      "blog post",
      "blog posts",
      "article",
      "articles",
      "news post",
      "news posts",
    ],

    strongSignals: [
      "post_id",
      "blog_post",
      "blog_posts",
      "post_content",
      "article_body",
      "published_at",
      "author_id",
    ],

    actions: [
      "create",
      "read",
      "update",
      "delete",
      "publish",
      "unpublish",
      "schedule",
      "archive",
      "manage",
    ],
  },

  {
    capabilityKey: "mediaLibrary",

    label: "Media Library",

    aliases: [
      "media library",
      "media asset",
      "media assets",
      "uploaded media",
      "asset library",
      "file upload",
      "file uploads",
      "image upload",
      "image uploads",
      "video upload",
      "video uploads",
      "storage bucket",
    ],

    strongSignals: [
      "storage",
      "bucket",
      "storage_path",
      "file_path",
      "public_url",
      "upload_file",
      "media_url",
      "image_url",
    ],

    actions: [
      "create",
      "read",
      "delete",
      "upload",
      "download",
      "manage",
    ],
  },

  /* =======================================================
     EVENTS
  ======================================================= */

  {
    capabilityKey: "events",

    label: "Events",

    aliases: [
      "events",
      "calendar event",
      "calendar events",
      "event listing",
      "event listings",
      "community events",
      "upcoming events",
    ],

    strongSignals: [
      "event_id",
      "event_date",
      "event_title",
      "event_location",
      "event_status",
      "venue",
      "start_time",
      "end_time",
    ],

    actions: [
      "create",
      "read",
      "update",
      "delete",
      "publish",
      "unpublish",
      "schedule",
      "cancel",
      "manage",
    ],
  },

  /* =======================================================
     MEMBERSHIP
  ======================================================= */

  {
    capabilityKey: "memberAccounts",

    label: "Member Accounts",

    aliases: [
      "member",
      "members",
      "member account",
      "member accounts",
      "subscriber",
      "subscribers",
      "subscriber account",
      "subscriber accounts",
    ],

    strongSignals: [
      "member_id",
      "member_account",
      "member_accounts",
      "subscriber_id",
      "subscriber_account",
      "subscriber_accounts",
      "member_email",
      "member_profile",
    ],

    actions: [
      "create",
      "read",
      "update",
      "approve",
      "reject",
      "archive",
      "manage",
    ],
  },

  {
    capabilityKey: "memberships",

    label: "Memberships",

    aliases: [
      "membership",
      "memberships",
      "membership tier",
      "membership tiers",
      "membership plan",
      "membership plans",
      "subscription tier",
      "subscription tiers",
    ],

    strongSignals: [
      "membership_id",
      "membership_status",
      "membership_tier",
      "membership_plan",
      "membership_level",
      "subscription_tier",
    ],

    actions: [
      "create",
      "read",
      "update",
      "delete",
      "publish",
      "unpublish",
      "archive",
      "manage",
    ],
  },

  /* =======================================================
     NONPROFIT
  ======================================================= */

  {
    capabilityKey: "donations",

    label: "Donations",

    aliases: [
      "donation",
      "donations",
      "donor",
      "donors",
      "contribution",
      "contributions",
      "charitable gift",
      "charitable gifts",
      "donation payment",
      "donation payments",
    ],

    strongSignals: [
      "donation_id",
      "donor_id",
      "donation_amount",
      "donation_status",
      "contribution_amount",
      "donated_at",
    ],

    actions: [
      "create",
      "read",
      "update",
      "refund",
      "manage",
    ],
  },

  /* =======================================================
     RADIO / AUDIO
  ======================================================= */

  {
    capabilityKey: "audio",

    label: "Audio",

    aliases: [
      "audio",
      "audio track",
      "audio tracks",
      "audio file",
      "audio files",
      "uploaded audio",
      "radio track",
      "radio tracks",
      "radio audio",
      "audio stream",
      "radio stream",
      "music stream",
    ],

    strongSignals: [
      "audio_url",
      "stream_url",
      "track_url",
      "audio_file",
      "audio_files",
      "audio_path",
      "audio_bucket",
      "radio_track_id",
      "audio_track_id",
    ],

    actions: [
      "create",
      "read",
      "update",
      "delete",
      "upload",
      "publish",
      "unpublish",
      "schedule",
      "manage",
    ],
  },

  {
    capabilityKey: "playlists",

    label: "Playlists",

    aliases: [
      "playlist",
      "playlists",
      "radio playlist",
      "radio playlists",
      "music playlist",
      "music playlists",
      "radio rotation",
      "radio rotations",
      "track queue",
      "track queues",
    ],

    strongSignals: [
      "playlist_id",
      "playlist_items",
      "track_id",
      "queue_position",
      "play_order",
      "rotation_id",
    ],

    actions: [
      "create",
      "read",
      "update",
      "delete",
      "schedule",
      "manage",
    ],
  },

  /*
   * Advertising is deliberately separate from generic
   * media uploads.
   *
   * A site may upload an advertisement file without its
   * media library itself being the advertising system.
   *
   * Examples:
   *
   * AdsManager
   * advertisements
   * ad_campaigns
   * sponsor_spots
   */
  {
    capabilityKey: "advertising",

    label: "Advertising",

    aliases: [
      "ads",
      "ads manager",
      "advertising",
      "advertisement",
      "advertisements",
      "advertising manager",
      "ad campaign",
      "ad campaigns",
      "radio ads",
      "radio advertising",
      "sponsor spot",
      "sponsor spots",
      "commercial spot",
      "commercial spots",
    ],

    strongSignals: [
      "ad_id",
      "advertisement_id",
      "advertising_id",
      "ad_campaign_id",
      "ads",
      "advertisements",
      "ad_campaigns",
      "sponsor_spots",
      "commercial_spots",
      "ad_audio_url",
      "ad_image_url",
      "ad_start_at",
      "ad_end_at",
    ],

    actions: [
      "create",
      "read",
      "update",
      "delete",
      "upload",
      "publish",
      "unpublish",
      "schedule",
      "archive",
      "manage",
    ],
  },

  /*
   * Programming represents a station's scheduled
   * programming structure.
   *
   * It is intentionally distinct from Playlists:
   *
   * Playlist
   *   = collection/order of tracks
   *
   * Programming
   *   = shows, blocks, segments, scheduled programming
   */
  {
    capabilityKey: "programming",

    label: "Programming",

    aliases: [
      "programming",
      "programming manager",
      "radio programming",
      "station programming",
      "program schedule",
      "program schedules",
      "programming schedule",
      "programming schedules",
      "radio schedule",
      "radio schedules",
      "show schedule",
      "show schedules",
      "broadcast schedule",
      "broadcast schedules",
      "scheduled programming",
    ],

    strongSignals: [
      "program_id",
      "programming_id",
      "program_schedule",
      "program_schedules",
      "programming_schedule",
      "radio_schedule",
      "broadcast_schedule",
      "show_id",
      "show_title",
      "show_start_time",
      "show_end_time",
      "air_date",
      "air_time",
      "scheduled_program",
    ],

    actions: [
      "create",
      "read",
      "update",
      "delete",
      "publish",
      "unpublish",
      "schedule",
      "cancel",
      "manage",
    ],
  },

  /*
   * Station Settings represents editable radio-station
   * configuration.
   *
   * This does NOT use generic "settings" as an alias because
   * almost every application contains unrelated settings.
   *
   * We require station/radio/broadcast language.
   */
  {
    capabilityKey: "stationSettings",

    label: "Station Settings",

    aliases: [
      "station settings",
      "station settings manager",
      "radio settings",
      "radio station settings",
      "broadcast settings",
      "station configuration",
      "radio configuration",
      "broadcast configuration",
    ],

    strongSignals: [
      "station_settings",
      "radio_settings",
      "broadcast_settings",
      "station_name",
      "station_description",
      "station_logo",
      "station_logo_url",
      "station_stream_url",
      "station_timezone",
      "station_config",
      "radio_config",
    ],

    actions: [
      "read",
      "update",
      "upload",
      "publish",
      "manage",
    ],
  },

  /* =======================================================
     DIARY / JOURNAL
  ======================================================= */

  {
    capabilityKey: "diary",

    label: "Diary",

    aliases: [
      "diary",
      "diary entry",
      "diary entries",
      "journal",
      "journal entry",
      "journal entries",
      "diary page",
      "diary pages",
      "journal page",
      "journal pages",
    ],

    strongSignals: [
      "diary_id",
      "diary_entry",
      "diary_entries",
      "journal_id",
      "journal_entry",
      "journal_entries",
      "entry_content",
      "diary_page",
      "diary_pages",
      "journal_page",
      "journal_pages",
      "diary_entry_versions",
    ],

    actions: [
      "create",
      "read",
      "update",
      "delete",
      "publish",
      "unpublish",
      "archive",
      "manage",
    ],
  },
];

/* =========================================================
   ACTION LANGUAGE
========================================================= */

export const canonicalActionAliases: Record<
  CanonicalAction,
  string[]
> = {
  create: [
    "create",
    "add",
    "new",
    "insert",
    "submit",
    "register",
  ],

  read: [
    "read",
    "get",
    "fetch",
    "list",
    "load",
    "view",
    "select",
    "find",
  ],

  update: [
    "update",
    "edit",
    "modify",
    "change",
    "save",
    "patch",
  ],

  delete: [
    "delete",
    "remove",
    "destroy",
    "purge",
  ],

  publish: [
    "publish",
    "go live",
    "activate",
    "make public",
  ],

  unpublish: [
    "unpublish",
    "take offline",
    "deactivate",
    "make private",
  ],

  approve: [
    "approve",
    "accept",
    "confirm",
    "verify",
  ],

  reject: [
    "reject",
    "deny",
    "decline",
  ],

  archive: [
    "archive",
    "hide",
    "retire",
  ],

  restore: [
    "restore",
    "recover",
    "unarchive",
  ],

  upload: [
    "upload",
    "attach",
    "store file",
  ],

  download: [
    "download",
    "export",
    "retrieve file",
  ],

  send: [
    "send",
    "reply",
    "respond",
    "notify",
    "email",
  ],

  schedule: [
    "schedule",
    "queue",
    "plan",
  ],

  cancel: [
    "cancel",
    "void",
  ],

  fulfill: [
    "fulfill",
    "fulfilled",
    "ship",
    "shipped",
    "dispatch",
    "complete order",
  ],

  refund: [
    "refund",
    "reimburse",
    "reverse payment",
  ],

  manage: [
    "manage",
    "manager",
    "admin",
    "control",
  ],
};

/* =========================================================
   NORMALIZATION
========================================================= */

export function normalizeScannerTerm(
  value: string
): string {
  return value
    .replace(
      /([a-z0-9])([A-Z])/g,
      "$1 $2"
    )
    .replace(
      /[_\-./\\]+/g,
      " "
    )
    .replace(
      /[^a-zA-Z0-9\s]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .toLowerCase();
}

export function tokenizeScannerTerm(
  value: string
): string[] {
  return normalizeScannerTerm(
    value
  )
    .split(" ")
    .filter(Boolean);
}

/* =========================================================
   CAPABILITY LOOKUP
========================================================= */

export function getCanonicalCapabilityLanguage(
  capabilityKey: string
): CanonicalCapabilityLanguage | null {
  return (
    canonicalCapabilityLanguage.find(
      (definition) =>
        definition.capabilityKey ===
        capabilityKey
    ) ?? null
  );
}

/* =========================================================
   ALIAS MATCHING
========================================================= */

export function matchesCanonicalAlias(
  value: string,
  alias: string
): boolean {
  const normalizedValue =
    normalizeScannerTerm(value);

  const normalizedAlias =
    normalizeScannerTerm(alias);

  if (
    !normalizedValue ||
    !normalizedAlias
  ) {
    return false;
  }

  if (
    normalizedValue ===
    normalizedAlias
  ) {
    return true;
  }

  const valueTokens =
    new Set(
      tokenizeScannerTerm(
        normalizedValue
      )
    );

  const aliasTokens =
    tokenizeScannerTerm(
      normalizedAlias
    );

  if (!aliasTokens.length) {
    return false;
  }

  return aliasTokens.every(
    (token) =>
      valueTokens.has(token)
  );
}

/* =========================================================
   ACTION MATCHING
========================================================= */

export function detectCanonicalActions(
  value: string
): CanonicalAction[] {
  const actions =
    new Set<CanonicalAction>();

  for (
    const [
      action,
      aliases,
    ] of Object.entries(
      canonicalActionAliases
    ) as Array<
      [
        CanonicalAction,
        string[],
      ]
    >
  ) {
    for (
      const alias
      of aliases
    ) {
      if (
        matchesCanonicalAlias(
          value,
          alias
        )
      ) {
        actions.add(action);
        break;
      }
    }
  }

  return [...actions];
}
