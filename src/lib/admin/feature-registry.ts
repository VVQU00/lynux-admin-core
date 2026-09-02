import type {
  FeatureDefinition,
} from "./types";

export const featureRegistry:
  FeatureDefinition[] = [
  /* =========================================================
     CORE WEBSITE
  ========================================================= */

  {
    key: "pages",
    label: "Pages",
    description:
      "Create and manage standard website pages.",
    category: "Core Website",
    defaultEnabled: true,
  },

  {
    key: "homepageEditor",
    label: "Homepage Editor",
    description:
      "Control editable homepage content.",
    category: "Core Website",
    defaultEnabled: true,
  },

  {
    key: "navigation",
    label: "Navigation",
    description:
      "Manage public navigation links.",
    category: "Core Website",
    defaultEnabled: true,
  },

  {
    key: "footer",
    label: "Footer",
    description:
      "Manage footer content and links.",
    category: "Core Website",
    defaultEnabled: true,
  },

  {
    key: "mediaLibrary",
    label: "Media Library",
    description:
      "Upload and manage images and files.",
    category: "Core Website",
    defaultEnabled: true,
  },

  {
    key: "galleries",
    label: "Galleries",
    description:
      "Create reusable media galleries.",
    category: "Core Website",
    defaultEnabled: false,
  },

  {
    key: "announcements",
    label: "Announcements",
    description:
      "Display site-wide announcements or alert bars.",
    category: "Core Website",
    defaultEnabled: false,
  },

  {
    key: "contactInfo",
    label: "Contact Information",
    description:
      "Manage public phone, email, address, and hours.",
    category: "Core Website",
    defaultEnabled: true,
  },

  {
    key: "socialLinks",
    label: "Social Links",
    description:
      "Manage public social media links.",
    category: "Core Website",
    defaultEnabled: true,
  },

  {
    key: "seo",
    label: "SEO Controls",
    description:
      "Manage titles, descriptions, indexing, and social previews.",
    category: "Core Website",
    defaultEnabled: true,
  },

  {
    key: "redirects",
    label: "Redirects",
    description:
      "Manage URL redirects.",
    category: "Core Website",
    defaultEnabled: false,
  },

  {
    key: "maintenanceMode",
    label: "Maintenance Mode",
    description:
      "Temporarily hide the public site behind a maintenance page.",
    category: "Core Website",
    defaultEnabled: true,
  },

  /* =========================================================
     COMMERCE
  ========================================================= */

  {
    key: "products",
    label: "Products",
    description:
      "Create and manage products.",
    category: "Commerce",
    defaultEnabled: false,
  },

  {
    key: "categories",
    label: "Product Categories",
    description:
      "Group products into categories.",
    category: "Commerce",
    defaultEnabled: false,
  },

  {
    key: "collections",
    label: "Collections",
    description:
      "Curate groups of products.",
    category: "Commerce",
    defaultEnabled: false,
  },

  {
    key: "variants",
    label: "Product Variants",
    description:
      "Support size, color, style, and other variants.",
    category: "Commerce",
    defaultEnabled: false,
  },

  {
    key: "inventory",
    label: "Inventory",
    description:
      "Track stock quantities.",
    category: "Commerce",
    defaultEnabled: false,
  },

  {
    key: "orders",
    label: "Orders",
    description:
      "Manage customer orders.",
    category: "Commerce",
    defaultEnabled: false,
  },

  {
    key: "shipping",
    label: "Shipping",
    description:
      "Configure delivery and shipping behavior.",
    category: "Commerce",
    defaultEnabled: false,
  },

  {
    key: "localPickup",
    label: "Local Pickup",
    description:
      "Allow local order pickup.",
    category: "Commerce",
    defaultEnabled: false,
  },

  {
    key: "discounts",
    label: "Discounts",
    description:
      "Create promotional discounts.",
    category: "Commerce",
    defaultEnabled: false,
  },

  {
    key: "coupons",
    label: "Coupons",
    description:
      "Create coupon codes.",
    category: "Commerce",
    defaultEnabled: false,
  },

  {
    key: "giftCards",
    label: "Gift Cards",
    description:
      "Enable gift card products and balances.",
    category: "Commerce",
    defaultEnabled: false,
  },

  {
    key: "reviews",
    label: "Reviews",
    description:
      "Collect and display product reviews.",
    category: "Commerce",
    defaultEnabled: false,
  },

  {
    key: "wishlists",
    label: "Wishlists",
    description:
      "Allow customers to save products.",
    category: "Commerce",
    defaultEnabled: false,
  },

  /* =========================================================
     SERVICES
  ========================================================= */

  {
    key: "services",
    label: "Services",
    description:
      "Manage offered services.",
    category: "Services",
    defaultEnabled: false,
  },

  {
    key: "bookings",
    label: "Bookings",
    description:
      "Allow customers to schedule services.",
    category: "Services",
    defaultEnabled: false,
  },

  {
    key: "appointments",
    label: "Appointments",
    description:
      "Manage appointment records.",
    category: "Services",
    defaultEnabled: false,
  },

  {
    key: "inquiries",
    label: "Inquiries",
    description:
      "Receive and manage customer, custom-order, service, or general inquiries.",
    category: "Services",
    defaultEnabled: false,
  },

  {
    key: "staffCalendars",
    label: "Staff Calendars",
    description:
      "Assign availability to staff.",
    category: "Services",
    defaultEnabled: false,
  },

  {
    key: "serviceAreas",
    label: "Service Areas",
    description:
      "Configure locations or regions served.",
    category: "Services",
    defaultEnabled: false,
  },

  {
    key: "intakeForms",
    label: "Intake Forms",
    description:
      "Collect information before service delivery.",
    category: "Services",
    defaultEnabled: false,
  },

  {
    key: "deposits",
    label: "Deposits",
    description:
      "Require deposits for bookings.",
    category: "Services",
    defaultEnabled: false,
  },

  /* =========================================================
     CONTENT & MEDIA
  ========================================================= */

  {
    key: "posts",
    label: "Posts",
    description:
      "Create and manage general publishable posts.",
    category: "Content & Media",
    defaultEnabled: false,
  },

  {
    key: "blog",
    label: "Blog",
    description:
      "Publish long-form articles.",
    category: "Content & Media",
    defaultEnabled: false,
  },

  {
    key: "news",
    label: "News",
    description:
      "Publish organization or company news.",
    category: "Content & Media",
    defaultEnabled: false,
  },

  {
    key: "videos",
    label: "Videos",
    description:
      "Manage video content.",
    category: "Content & Media",
    defaultEnabled: false,
  },

  {
    key: "audio",
    label: "Audio",
    description:
      "Manage uploaded audio, radio tracks, streams, and other audio content.",
    category: "Content & Media",
    defaultEnabled: false,
  },

  {
    key: "playlists",
    label: "Playlists",
    description:
      "Create and manage ordered audio or media playlists and rotations.",
    category: "Content & Media",
    defaultEnabled: false,
  },

  {
    key: "programming",
    label: "Programming",
    description:
      "Manage scheduled shows, broadcast blocks, segments, and station programming.",
    category: "Content & Media",
    defaultEnabled: false,
  },

  {
    key: "podcasts",
    label: "Podcasts",
    description:
      "Manage podcast episodes.",
    category: "Content & Media",
    defaultEnabled: false,
  },

  {
    key: "downloads",
    label: "Downloads",
    description:
      "Publish downloadable resources.",
    category: "Content & Media",
    defaultEnabled: false,
  },

  {
    key: "testimonials",
    label: "Testimonials",
    description:
      "Manage customer/client testimonials.",
    category: "Content & Media",
    defaultEnabled: false,
  },

  {
    key: "faqs",
    label: "FAQs",
    description:
      "Manage frequently asked questions.",
    category: "Content & Media",
    defaultEnabled: false,
  },

  {
    key: "diary",
    label: "Diary",
    description:
      "Create and manage diary pages and content.",
    category: "Content & Media",
    defaultEnabled: false,
  },

  /* =========================================================
     EVENTS
  ========================================================= */

  {
    key: "events",
    label: "Events",
    description:
      "Create and publish events.",
    category: "Events",
    defaultEnabled: false,
  },

  {
    key: "eventRegistration",
    label: "Event Registration",
    description:
      "Allow visitors to register for events.",
    category: "Events",
    defaultEnabled: false,
  },

  {
    key: "tickets",
    label: "Tickets",
    description:
      "Manage event tickets.",
    category: "Events",
    defaultEnabled: false,
  },

  {
    key: "venues",
    label: "Venues",
    description:
      "Manage event locations.",
    category: "Events",
    defaultEnabled: false,
  },

  {
    key: "rsvp",
    label: "RSVP",
    description:
      "Track event responses.",
    category: "Events",
    defaultEnabled: false,
  },

  /* =========================================================
     ORGANIZATIONS
  ========================================================= */

  {
    key: "donations",
    label: "Donations",
    description:
      "Accept or track donations.",
    category: "Organizations",
    defaultEnabled: false,
  },

  {
    key: "campaigns",
    label: "Campaigns",
    description:
      "Manage fundraising or awareness campaigns.",
    category: "Organizations",
    defaultEnabled: false,
  },

  {
    key: "volunteers",
    label: "Volunteers",
    description:
      "Manage volunteers and applications.",
    category: "Organizations",
    defaultEnabled: false,
  },

  {
    key: "programs",
    label: "Programs",
    description:
      "Manage organizational programs.",
    category: "Organizations",
    defaultEnabled: false,
  },

  {
    key: "sponsors",
    label: "Sponsors",
    description:
      "Manage sponsors and partners.",
    category: "Organizations",
    defaultEnabled: false,
  },

  {
    key: "applications",
    label: "Applications",
    description:
      "Collect and review applications.",
    category: "Organizations",
    defaultEnabled: false,
  },

  /* =========================================================
     MEMBERSHIP
  ========================================================= */

  {
    key: "memberAccounts",
    label: "Member Accounts",
    description:
      "Enable member login accounts.",
    category: "Membership",
    defaultEnabled: false,
  },

  {
    key: "memberships",
    label: "Memberships",
    description:
      "Manage membership tiers.",
    category: "Membership",
    defaultEnabled: false,
  },

  {
    key: "subscriptions",
    label: "Subscriptions",
    description:
      "Manage recurring subscriptions.",
    category: "Membership",
    defaultEnabled: false,
  },

  {
    key: "memberOnlyPages",
    label: "Member-Only Pages",
    description:
      "Restrict content to members.",
    category: "Membership",
    defaultEnabled: false,
  },

  {
    key: "directories",
    label: "Directories",
    description:
      "Create searchable member or business directories.",
    category: "Membership",
    defaultEnabled: false,
  },

  /* =========================================================
     EDUCATION
  ========================================================= */

  {
    key: "courses",
    label: "Courses",
    description:
      "Manage courses.",
    category: "Education",
    defaultEnabled: false,
  },

  {
    key: "lessons",
    label: "Lessons",
    description:
      "Manage lesson content.",
    category: "Education",
    defaultEnabled: false,
  },

  {
    key: "instructors",
    label: "Instructors",
    description:
      "Manage instructors.",
    category: "Education",
    defaultEnabled: false,
  },

  {
    key: "students",
    label: "Students",
    description:
      "Manage students.",
    category: "Education",
    defaultEnabled: false,
  },

  {
    key: "quizzes",
    label: "Quizzes",
    description:
      "Create quizzes and assessments.",
    category: "Education",
    defaultEnabled: false,
  },

  {
    key: "enrollment",
    label: "Enrollment",
    description:
      "Manage course enrollment.",
    category: "Education",
    defaultEnabled: false,
  },

  /* =========================================================
     REAL ESTATE
  ========================================================= */

  {
    key: "propertyListings",
    label: "Property Listings",
    description:
      "Manage real estate listings.",
    category: "Real Estate",
    defaultEnabled: false,
  },

  {
    key: "agents",
    label: "Agents",
    description:
      "Manage real estate agents.",
    category: "Real Estate",
    defaultEnabled: false,
  },

  {
    key: "propertyAmenities",
    label: "Property Amenities",
    description:
      "Manage property amenity data.",
    category: "Real Estate",
    defaultEnabled: false,
  },

  {
    key: "propertyInquiries",
    label: "Property Inquiries",
    description:
      "Collect property inquiries.",
    category: "Real Estate",
    defaultEnabled: false,
  },

  /* =========================================================
     MARKETING
  ========================================================= */

  {
    key: "newsletter",
    label: "Newsletter",
    description:
      "Collect newsletter subscribers.",
    category: "Marketing",
    defaultEnabled: false,
  },

  {
    key: "popups",
    label: "Popups",
    description:
      "Manage promotional or informational popups.",
    category: "Marketing",
    defaultEnabled: false,
  },

  {
    key: "advertising",
    label: "Advertising",
    description:
      "Manage advertisements, campaigns, sponsor spots, and scheduled promotional media.",
    category: "Marketing",
    defaultEnabled: false,
  },

  {
    key: "analytics",
    label: "Analytics",
    description:
      "Display website performance data.",
    category: "Marketing",
    defaultEnabled: false,
  },

  {
    key: "trackingIntegrations",
    label: "Tracking Integrations",
    description:
      "Configure analytics and conversion integrations.",
    category: "Marketing",
    defaultEnabled: false,
  },

  /* =========================================================
     OPERATIONS
  ========================================================= */

  {
    key: "leads",
    label: "Leads",
    description:
      "Track prospective customers or contacts.",
    category: "Operations",
    defaultEnabled: false,
  },

  {
    key: "customers",
    label: "Customers",
    description:
      "Manage customer records.",
    category: "Operations",
    defaultEnabled: false,
  },

  {
    key: "contactForms",
    label: "Contact Forms",
    description:
      "Receive and manage contact submissions.",
    category: "Operations",
    defaultEnabled: true,
  },

  {
    key: "stationSettings",
    label: "Station Settings",
    description:
      "Manage radio or broadcast station identity, stream configuration, branding, and station-level settings.",
    category: "Operations",
    defaultEnabled: false,
  },

  {
    key: "exports",
    label: "Exports",
    description:
      "Export business data.",
    category: "Operations",
    defaultEnabled: false,
  },

  {
    key: "notifications",
    label: "Notifications",
    description:
      "Manage admin notifications.",
    category: "Operations",
    defaultEnabled: true,
  },

  {
    key: "activityLog",
    label: "Activity Log",
    description:
      "Record important admin actions.",
    category: "Operations",
    defaultEnabled: true,
  },

  /* =========================================================
     SECURITY
  ========================================================= */

  {
    key: "adminUsers",
    label: "Admin Users",
    description:
      "Manage administrator accounts.",
    category: "Security",
    defaultEnabled: true,
  },

  {
    key: "roles",
    label: "Roles & Permissions",
    description:
      "Control what each admin role may access.",
    category: "Security",
    defaultEnabled: true,
  },

  {
    key: "twoFactorAuth",
    label: "Two-Factor Authentication",
    description:
      "Require stronger sign-in verification.",
    category: "Security",
    defaultEnabled: true,
  },

  {
    key: "sessionControls",
    label: "Session Controls",
    description:
      "Configure admin session lifetime and revocation.",
    category: "Security",
    defaultEnabled: true,
  },

  {
    key: "loginHistory",
    label: "Login History",
    description:
      "Track administrator login events.",
    category: "Security",
    defaultEnabled: true,
  },

  {
    key: "auditLog",
    label: "Audit Log",
    description:
      "Record security-sensitive actions.",
    category: "Security",
    defaultEnabled: true,
  },

  {
    key: "ipRestrictions",
    label: "IP Restrictions",
    description:
      "Optionally restrict admin access by network.",
    category: "Security",
    defaultEnabled: false,
  },

  /* =========================================================
     DEVELOPER
  ========================================================= */

  {
    key: "apiAccess",
    label: "API Access",
    description:
      "Manage site API integrations.",
    category: "Developer",
    defaultEnabled: false,
    masterOnly: true,
  },

  {
    key: "webhooks",
    label: "Webhooks",
    description:
      "Configure outgoing event webhooks.",
    category: "Developer",
    defaultEnabled: false,
    masterOnly: true,
  },

  {
    key: "featureFlags",
    label: "Feature Flags",
    description:
      "Control the installed feature set.",
    category: "Developer",
    defaultEnabled: true,
    masterOnly: true,
  },

  {
    key: "environmentSettings",
    label: "Environment Settings",
    description:
      "Manage safe deployment-level configuration.",
    category: "Developer",
    defaultEnabled: true,
    masterOnly: true,
  },

  {
    key: "clientProvisioning",
    label: "Client Provisioning",
    description:
      "Create isolated client admin instances.",
    category: "Developer",
    defaultEnabled: true,
    masterOnly: true,
  },
];