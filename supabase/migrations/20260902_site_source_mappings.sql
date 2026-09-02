insert into public.site_sources (
  site_id,
  provider,
  repository_owner,
  repository_name,
  branch,
  subdirectory
)
values
  (
    'bluus-isle',
    'github',
    'VVQU00',
    'bluus-isle',
    'main',
    null
  ),
  (
    'bluu-diary',
    'github',
    'VVQU00',
    'bluu-diary',
    'main',
    null
  ),
  (
    'island-mango-radio',
    'github',
    'VVQU00',
    'island-mango-redesign',
    'master',
    null
  ),
  (
    'layers-of-hope-foundation',
    'github',
    'VVQU00',
    'layers-of-hope-foundation',
    'main',
    null
  )
on conflict (site_id)
do update set
  provider =
    excluded.provider,

  repository_owner =
    excluded.repository_owner,

  repository_name =
    excluded.repository_name,

  branch =
    excluded.branch,

  subdirectory =
    excluded.subdirectory,

  updated_at =
    now();