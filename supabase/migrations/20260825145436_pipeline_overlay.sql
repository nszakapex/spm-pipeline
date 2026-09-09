-- Durable overlay for ingest + manual logs.
-- Server writes with the service role (bypasses RLS).
-- anon / authenticated have no policies, so the Data API cannot read these rows.

create table if not exists public.pipeline_lead_state (
  id text primary key,
  kind text not null check (kind in ('patch', 'extra')),
  body jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.pipeline_activities (
  id text primary key,
  lead_id text not null,
  body jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists pipeline_activities_lead_idx
  on public.pipeline_activities (lead_id, created_at desc);

create table if not exists public.pipeline_source_events (
  id text primary key,
  body jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pipeline_sync_events (
  id text primary key,
  body jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pipeline_score_factors (
  lead_id text primary key,
  body jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.pipeline_score_snapshots (
  id text primary key,
  lead_id text not null,
  body jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pipeline_ingest_receipts (
  id text primary key,
  idempotency_key text not null unique,
  body jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pipeline_seen_events (
  idempotency_key text primary key,
  seen_at timestamptz not null default now()
);

alter table public.pipeline_lead_state enable row level security;
alter table public.pipeline_activities enable row level security;
alter table public.pipeline_source_events enable row level security;
alter table public.pipeline_sync_events enable row level security;
alter table public.pipeline_score_factors enable row level security;
alter table public.pipeline_score_snapshots enable row level security;
alter table public.pipeline_ingest_receipts enable row level security;
alter table public.pipeline_seen_events enable row level security;

revoke all on public.pipeline_lead_state from anon, authenticated;
revoke all on public.pipeline_activities from anon, authenticated;
revoke all on public.pipeline_source_events from anon, authenticated;
revoke all on public.pipeline_sync_events from anon, authenticated;
revoke all on public.pipeline_score_factors from anon, authenticated;
revoke all on public.pipeline_score_snapshots from anon, authenticated;
revoke all on public.pipeline_ingest_receipts from anon, authenticated;
revoke all on public.pipeline_seen_events from anon, authenticated;

grant all on public.pipeline_lead_state to service_role;
grant all on public.pipeline_activities to service_role;
grant all on public.pipeline_source_events to service_role;
grant all on public.pipeline_sync_events to service_role;
grant all on public.pipeline_score_factors to service_role;
grant all on public.pipeline_score_snapshots to service_role;
grant all on public.pipeline_ingest_receipts to service_role;
grant all on public.pipeline_seen_events to service_role;
