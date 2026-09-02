/* =========================================================

   LYNUX ADMIN CORE

   SCANNER CANONICAL CAPABILITY REGISTRY

   PURPOSE:

   Register canonical Admin Core capability keys introduced
   for LYNUX Scanner v1.

   site_capabilities.capability_key references:

     public.capability_registry.key

   Therefore every scanner capability that may be approved
   must exist here before Scanner Review can synchronize it
   into public.site_capabilities.

========================================================= */


/* =========================================================

   SCANNER / ADMIN CORE CAPABILITIES

========================================================= */

insert into public.capability_registry (
  key,
  label,
  description,
  category,
  dangerous,
  master_only
)
values

  (
    'inquiries',
    'Inquiries',
    'Receive and manage customer, custom-order, service, or general inquiries.',
    'Services',
    false,
    false
  ),

  (
    'posts',
    'Posts',
    'Create and manage general publishable posts.',
    'Content & Media',
    false,
    false
  ),

  (
    'audio',
    'Audio',
    'Manage uploaded audio, radio tracks, streams, and other audio content.',
    'Content & Media',
    false,
    false
  ),

  (
    'playlists',
    'Playlists',
    'Create and manage ordered audio or media playlists and rotations.',
    'Content & Media',
    false,
    false
  ),

  (
    'advertising',
    'Advertising',
    'Manage advertisements, campaigns, sponsor spots, and scheduled promotional media.',
    'Marketing',
    false,
    false
  ),

  (
    'programming',
    'Programming',
    'Manage scheduled shows, broadcast blocks, segments, and station programming.',
    'Content & Media',
    false,
    false
  ),

  (
    'stationSettings',
    'Station Settings',
    'Manage radio or broadcast station identity, stream configuration, branding, and station-level settings.',
    'Operations',
    false,
    false
  )

on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  category = excluded.category,
  dangerous = excluded.dangerous,
  master_only = excluded.master_only,
  updated_at = now();


/* =========================================================

   EXISTING CANONICAL KEY

   "diary" already existed before Scanner v1.

   Scanner canonical language maps diary-entry implementations
   to the existing Admin Core "diary" capability rather than
   creating a separate "diaryEntries" capability.

========================================================= */


/* =========================================================

   ARCHITECTURE RULE

   Registry presence does NOT mean:

     detected = true
     approved = true
     enabled = true

   This migration only registers valid canonical capability
   identities.

   Scanner detection, manual approval, and Admin Core
   enablement remain separate states.

========================================================= */