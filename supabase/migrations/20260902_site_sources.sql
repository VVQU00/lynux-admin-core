create table if not exists public.site_sources (
  site_id text primary key
    references public.sites(id)
    on delete cascade,

  provider text not null
    default 'github'
    check (
      provider in ('github')
    ),

  repository_owner text not null,

  repository_name text not null,

  branch text not null
    default 'main',

  subdirectory text null,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);


alter table public.site_sources
enable row level security;


grant select,
      insert,
      update,
      delete
on table public.site_sources
to service_role;


create index if not exists
  site_sources_provider_idx
on public.site_sources(provider);