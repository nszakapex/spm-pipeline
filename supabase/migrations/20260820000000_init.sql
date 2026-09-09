-- SPM Pipeline initial schema
-- HubSpot remains CRM source of truth; these tables are the operational projection.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'sales', 'viewer');
create type public.lead_stage as enum (
  'NEW',
  'ATTEMPTING_CONTACT',
  'CONNECTED',
  'QUALIFIED',
  'JAKE_READY',
  'CALL_BOOKED',
  'CALL_HELD',
  'ENROLLMENT_PENDING',
  'WON',
  'LOST'
);
create type public.lead_disposition as enum (
  'ACTIVE',
  'NURTURE',
  'NO_RESPONSE',
  'NOT_QUALIFIED',
  'NO_SHOW',
  'INVALID_CONTACT'
);
create type public.score_band as enum ('P1', 'P2', 'P3', 'P4');
create type public.qualification_status as enum ('unknown', 'pending', 'qualified', 'not_qualified');
create type public.meeting_status as enum ('none', 'booked', 'held', 'no_show', 'canceled', 'rescheduled');
create type public.sync_status as enum ('not_synced', 'pending', 'synced', 'failed', 'conflict', 'stale');
create type public.next_action_type as enum (
  'CALL_NOW', 'CALL', 'EMAIL', 'TEXT', 'FOLLOW_UP', 'RESCHEDULE',
  'QUALIFY', 'HANDOFF', 'BOOK_MEETING', 'REVIEW', 'OTHER'
);
create type public.source_category as enum (
  'website', 'form', 'assessment', 'organic', 'paid_search', 'paid_social',
  'referral_family', 'referral_jake', 'school_partner', 'ed_consultant',
  'clinician_referral', 'tutoring_provider', 'community', 'event',
  'inbound_phone', 'manual', 'other_campaign'
);
create type public.reconciliation_status as enum (
  'pending', 'matched', 'created', 'duplicate', 'unmatched', 'failed', 'ignored'
);
create type public.processing_status as enum (
  'received', 'normalized', 'processing', 'processed', 'error'
);
create type public.activity_type as enum (
  'captured', 'assigned', 'call', 'email', 'sms', 'reply', 'note',
  'stage_change', 'disposition_change', 'score_change',
  'meeting_booked', 'meeting_held', 'no_show', 'followup_scheduled', 'sync_event'
);
create type public.activity_direction as enum ('inbound', 'outbound', 'system', 'internal');
create type public.score_factor_type as enum (
  'intent', 'engagement', 'readiness', 'source_quality', 'negative'
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  role public.user_role not null default 'sales',
  created_at timestamptz not null default now()
);

create table public.source_definitions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category public.source_category not null,
  enabled boolean not null default true,
  expected_sync_provider text not null default 'hubspot',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  owner_id uuid references public.users(id),
  source text not null,
  source_detail text,
  source_definition_id uuid references public.source_definitions(id),
  campaign text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  stage public.lead_stage not null default 'NEW',
  disposition public.lead_disposition not null default 'ACTIVE',
  score integer not null default 0 check (score >= 0 and score <= 100),
  score_band public.score_band not null default 'P4',
  score_version text not null default 'v1',
  created_at timestamptz not null default now(),
  first_contact_at timestamptz,
  last_contact_at timestamptz,
  last_activity_at timestamptz,
  next_action_at timestamptz,
  next_action_type public.next_action_type,
  next_action_note text,
  qualification_status public.qualification_status not null default 'unknown',
  qualification_reason text,
  qualified_at timestamptz,
  meeting_booked_at timestamptz,
  meeting_status public.meeting_status not null default 'none',
  nurture_reason text,
  nurture_until timestamptz,
  lost_reason text,
  hubspot_contact_id text,
  hubspot_lead_id text,
  hubspot_deal_id text,
  sync_status public.sync_status not null default 'not_synced',
  last_synced_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.lead_source_events (
  id uuid primary key default gen_random_uuid(),
  source_type public.source_category not null,
  source_name text not null,
  source_detail text,
  source_definition_id uuid references public.source_definitions(id),
  external_event_id text,
  campaign text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  received_at timestamptz not null,
  raw_payload_summary_json jsonb not null default '{}'::jsonb,
  normalized_identity_json jsonb not null default '{}'::jsonb,
  processing_status public.processing_status not null default 'received',
  matched_lead_id uuid references public.leads(id),
  hubspot_contact_id text,
  hubspot_lead_id text,
  reconciliation_status public.reconciliation_status not null default 'pending',
  reconciliation_reason text,
  last_reconciliation_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index lead_source_events_external_uidx
  on public.lead_source_events (source_definition_id, external_event_id)
  where external_event_id is not null;

create table public.lead_score_factors (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  factor_type public.score_factor_type not null,
  label text not null,
  points integer not null,
  source text not null,
  created_at timestamptz not null default now()
);

create table public.lead_score_snapshots (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  score integer not null,
  band public.score_band not null,
  version text not null,
  reason_summary text not null,
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  activity_type public.activity_type not null,
  direction public.activity_direction not null default 'system',
  title text not null,
  body_summary text,
  occurred_at timestamptz not null,
  created_by uuid references public.users(id),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.integration_sync_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'hubspot',
  object_type text not null,
  object_id text,
  direction text not null check (direction in ('inbound', 'outbound')),
  status text not null check (status in ('success', 'failed', 'retrying', 'skipped')),
  reason text,
  attempted_at timestamptz not null,
  completed_at timestamptz,
  lead_id uuid references public.leads(id),
  source_event_id uuid references public.lead_source_events(id)
);

create index leads_owner_stage_next_idx on public.leads (owner_id, stage, next_action_at);
create index leads_score_band_idx on public.leads (score_band, score desc);
create index leads_source_created_idx on public.leads (source_definition_id, created_at desc);
create index leads_sync_failed_idx on public.leads (sync_status) where sync_status = 'failed';
create index lead_source_events_status_idx on public.lead_source_events (reconciliation_status, received_at desc);
create index activities_lead_occurred_idx on public.activities (lead_id, occurred_at desc);
create index lead_score_factors_lead_idx on public.lead_score_factors (lead_id);

alter table public.users enable row level security;
alter table public.source_definitions enable row level security;
alter table public.leads enable row level security;
alter table public.lead_source_events enable row level security;
alter table public.lead_score_factors enable row level security;
alter table public.lead_score_snapshots enable row level security;
alter table public.activities enable row level security;
alter table public.integration_sync_events enable row level security;

-- Authenticated read policies (tighten write policies before live pilot)
create policy "authenticated read users" on public.users for select to authenticated using (true);
create policy "authenticated read sources" on public.source_definitions for select to authenticated using (true);
create policy "authenticated read leads" on public.leads for select to authenticated using (true);
create policy "authenticated read source events" on public.lead_source_events for select to authenticated using (true);
create policy "authenticated read score factors" on public.lead_score_factors for select to authenticated using (true);
create policy "authenticated read score snapshots" on public.lead_score_snapshots for select to authenticated using (true);
create policy "authenticated read activities" on public.activities for select to authenticated using (true);
create policy "authenticated read sync events" on public.integration_sync_events for select to authenticated using (true);
