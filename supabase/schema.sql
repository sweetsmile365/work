create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key,
  email text,
  display_name text,
  avatar_url text,
  preferred_language text default 'zh',
  timezone text default 'Asia/Tokyo',
  notification_enabled boolean default true,
  last_login_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.family_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid references public.family_groups(id) on delete cascade,
  profile_id uuid references public.profiles(id),
  name text not null,
  role text not null check (role in ('admin','parent','child_editor')),
  color text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.calendars (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid references public.family_groups(id) on delete cascade,
  name text not null,
  calendar_type text not null check (calendar_type in ('japan_holiday','china_reference_holiday','company','school','child_activity','family','personal')),
  color text,
  visibility text not null default 'family' check (visibility in ('private','family','parents_only')),
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid references public.family_groups(id) on delete cascade,
  name text not null,
  from_label text,
  to_label text,
  transport_mode text check (transport_mode in ('walk','bicycle','car','train','bus','school_bus','mixed','other')),
  estimated_minutes integer default 0,
  buffer_minutes integer default 0,
  default_departure_reminder_minutes integer default 10,
  note text,
  active boolean default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.bus_stops (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid references public.family_groups(id) on delete cascade,
  stop_name text,
  stop_name_jp text,
  stop_type text check (stop_type in ('public_bus_stop','school_bus_stop','station','school','home_area','other')),
  note text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.bus_timetables (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid references public.family_groups(id) on delete cascade,
  route_id uuid references public.routes(id),
  line_name text,
  direction_name text,
  from_stop_id uuid references public.bus_stops(id),
  to_stop_id uuid references public.bus_stops(id),
  service_day_type text check (service_day_type in ('weekday','saturday','sunday_holiday','school_day','school_holiday','special')),
  departure_time time,
  arrival_time time,
  estimated_minutes integer,
  bus_type text check (bus_type in ('public_bus','school_bus','other')),
  source_type text,
  source_note text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid references public.family_groups(id) on delete cascade,
  calendar_id uuid references public.calendars(id),
  title text not null,
  title_original_jp text,
  title_cn text,
  description text,
  event_type text not null,
  start_datetime timestamptz,
  end_datetime timestamptz,
  date date not null,
  all_day boolean default false,
  location text,
  visibility text default 'family' check (visibility in ('private','family','parents_only')),
  is_day_off boolean default false,
  need_parent_action boolean default false,
  parent_task text,
  child_note text,
  change_request_status text,
  change_request_note text,
  source_type text,
  source_file_id uuid,
  route_id uuid references public.routes(id),
  bus_timetable_id uuid references public.bus_timetables(id),
  need_transport boolean default false,
  transport_owner text,
  planned_departure_time timestamptz,
  planned_arrival_time timestamptz,
  pickup_required boolean default false,
  dropoff_required boolean default false,
  route_note text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.event_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  family_member_id uuid references public.family_members(id) on delete cascade,
  role text,
  created_at timestamptz default now()
);

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid references public.family_groups(id) on delete cascade,
  country text,
  date date,
  name text,
  name_jp text,
  name_cn text,
  holiday_type text,
  is_day_off boolean default false,
  is_adjusted_workday boolean default false,
  is_reference_only boolean default false,
  source text,
  year integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid references public.family_groups(id) on delete cascade,
  child_member_id uuid references public.family_members(id),
  name text,
  name_jp text,
  name_cn text,
  activity_type text check (activity_type in ('school','badminton','piano','english','chinese','other')),
  default_day_of_week integer,
  default_start_time time,
  default_end_time time,
  location text,
  teacher_name text,
  contact text,
  transport_required boolean default false,
  default_transport_owner text,
  fee_note text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.child_tasks (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid references public.family_groups(id) on delete cascade,
  child_member_id uuid references public.family_members(id),
  event_id uuid references public.events(id),
  activity_id uuid references public.activities(id),
  title text not null,
  task_type text check (task_type in ('homework','practice','bring_item','payment','transport','reply','makeup_lesson','exam_preparation','other')),
  due_date date,
  assigned_to text,
  status text default 'todo',
  completed_by_child boolean default false,
  completed_at timestamptz,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid references public.family_groups(id) on delete cascade,
  source_type text,
  default_language text,
  document_type text,
  status text,
  uploaded_by uuid references public.profiles(id),
  ocr_provider text,
  ocr_status text,
  ocr_started_at timestamptz,
  ocr_finished_at timestamptz,
  ocr_error_message text,
  raw_ocr_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.import_files (
  id uuid primary key default gen_random_uuid(),
  import_id uuid references public.imports(id) on delete cascade,
  storage_bucket text,
  storage_path text,
  original_filename text,
  mime_type text,
  file_size integer,
  checksum text,
  uploaded_by uuid references public.profiles(id),
  uploaded_at timestamptz default now(),
  ocr_text text,
  ocr_json jsonb,
  page_count integer,
  image_width integer,
  image_height integer
);

create table if not exists public.import_candidates (
  id uuid primary key default gen_random_uuid(),
  import_id uuid references public.imports(id) on delete cascade,
  date date,
  start_time time,
  end_time time,
  title text,
  title_original_jp text,
  title_cn text,
  raw_text text,
  raw_text_jp text,
  event_type text,
  is_day_off boolean,
  calendar_type text,
  confidence numeric,
  detected_language text,
  fiscal_year integer,
  date_parse_status text,
  date_parse_note text,
  need_parent_action boolean default false,
  note text,
  confirmed boolean default false,
  ignored boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.bus_timetable_candidates (
  id uuid primary key default gen_random_uuid(),
  import_id uuid references public.imports(id) on delete cascade,
  route_id uuid references public.routes(id),
  line_name text,
  direction_name text,
  from_label text,
  to_label text,
  service_day_type text,
  departure_time time,
  arrival_time time,
  estimated_minutes integer,
  confidence numeric,
  raw_text_jp text,
  note text,
  confirmed boolean default false,
  ignored boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.event_revisions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  old_value_json jsonb,
  new_value_json jsonb,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz default now(),
  change_reason text
);

create table if not exists public.backup_jobs (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid references public.family_groups(id) on delete cascade,
  backup_type text,
  status text,
  started_at timestamptz,
  finished_at timestamptz,
  file_path text,
  file_size integer,
  checksum text,
  error_message text,
  created_by uuid references public.profiles(id)
);

create or replace function public.capture_event_revision()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    insert into public.event_revisions(event_id, old_value_json, new_value_json, changed_by, change_reason)
    values (old.id, to_jsonb(old), to_jsonb(new), new.updated_by, 'event updated');
  end if;
  return new;
end;
$$;

drop trigger if exists events_revision_trigger on public.events;
create trigger events_revision_trigger after update on public.events for each row execute function public.capture_event_revision();

create index if not exists events_family_date_idx on public.events(family_group_id, date) where deleted_at is null;
create index if not exists import_candidates_import_idx on public.import_candidates(import_id);
create index if not exists bus_timetables_route_idx on public.bus_timetables(route_id);

alter table public.profiles enable row level security;
alter table public.family_groups enable row level security;
alter table public.family_members enable row level security;
alter table public.calendars enable row level security;
alter table public.events enable row level security;
alter table public.routes enable row level security;
alter table public.bus_timetables enable row level security;
alter table public.imports enable row level security;
alter table public.import_files enable row level security;
alter table public.import_candidates enable row level security;
alter table public.backup_jobs enable row level security;

create policy "family members can read profiles" on public.profiles for select using (auth.uid() = id);
create policy "authenticated can read family data" on public.family_groups for select using (auth.role() = 'authenticated');
create policy "authenticated can read members" on public.family_members for select using (auth.role() = 'authenticated');
create policy "authenticated can read calendars" on public.calendars for select using (auth.role() = 'authenticated');
create policy "authenticated can read events" on public.events for select using (auth.role() = 'authenticated');
create policy "authenticated can write events" on public.events for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated can read routes" on public.routes for select using (auth.role() = 'authenticated');
create policy "authenticated can write routes" on public.routes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated can read bus timetables" on public.bus_timetables for select using (auth.role() = 'authenticated');
create policy "authenticated can write bus timetables" on public.bus_timetables for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated can manage imports" on public.imports for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated can manage import files" on public.import_files for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated can manage import candidates" on public.import_candidates for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated can manage backups" on public.backup_jobs for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
