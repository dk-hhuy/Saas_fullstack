-- Restore public schema (companions + session_history + bookmarks)
-- Use in Supabase SQL Editor if full psql restore fails.
-- After fresh restore, also run: scripts/migrations/001-feature-pack.sql (if columns missing)

create table if not exists public.companions (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamptz default now() not null,
    name varchar,
    subject varchar,
    topic varchar,
    style varchar,
    voice varchar,
    duration bigint,
    author varchar,
    is_public boolean not null default false
);

create table if not exists public.session_history (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamptz default now() not null,
    user_id varchar,
    companion_id uuid references public.companions(id) on update cascade on delete cascade,
    transcript jsonb not null default '[]',
    duration_seconds integer,
    started_at timestamptz,
    ended_at timestamptz
);

create table if not exists public.bookmarks (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamptz default now() not null,
    user_id varchar not null,
    companion_id uuid not null references public.companions(id) on delete cascade,
    unique (user_id, companion_id)
);

alter table public.companions enable row level security;
alter table public.session_history enable row level security;
alter table public.bookmarks enable row level security;

drop policy if exists "All" on public.companions;
drop policy if exists "All" on public.session_history;
drop policy if exists "Clerk" on public.companions;
drop policy if exists "Clerk" on public.session_history;
drop policy if exists "companions_select" on public.companions;
drop policy if exists "companions_insert" on public.companions;
drop policy if exists "companions_update" on public.companions;
drop policy if exists "companions_delete" on public.companions;
drop policy if exists "sessions_select_own" on public.session_history;
drop policy if exists "sessions_insert_own" on public.session_history;
drop policy if exists "sessions_update_own" on public.session_history;
drop policy if exists "bookmarks_all_own" on public.bookmarks;

create policy "companions_select" on public.companions
  for select to authenticated, anon
  using (is_public = true or author = (auth.jwt() ->> 'sub'));

create policy "companions_insert" on public.companions
  for insert to authenticated
  with check (author = (auth.jwt() ->> 'sub'));

create policy "companions_update" on public.companions
  for update to authenticated
  using (author = (auth.jwt() ->> 'sub'))
  with check (author = (auth.jwt() ->> 'sub'));

create policy "companions_delete" on public.companions
  for delete to authenticated
  using (author = (auth.jwt() ->> 'sub'));

create policy "sessions_select_own" on public.session_history
  for select to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));

create policy "sessions_insert_own" on public.session_history
  for insert to authenticated
  with check (user_id = (auth.jwt() ->> 'sub'));

create policy "sessions_update_own" on public.session_history
  for update to authenticated
  using (user_id = (auth.jwt() ->> 'sub'))
  with check (user_id = (auth.jwt() ->> 'sub'));

create policy "bookmarks_all_own" on public.bookmarks
  for all to authenticated
  using (user_id = (auth.jwt() ->> 'sub'))
  with check (user_id = (auth.jwt() ->> 'sub'));

grant all on table public.companions to anon, authenticated, service_role;
grant all on table public.session_history to anon, authenticated, service_role;
grant all on table public.bookmarks to authenticated, service_role;

insert into public.companions (id, created_at, name, subject, topic, style, voice, duration, author, is_public) values
  ('3938ba50-93bd-4dd4-8b1e-3bda9c13dcad', '2025-08-03 07:21:52.742366+00', 'Science Tutor', 'science', 'The most interesting things in science', 'casual', 'male', 15, 'user_30Y5SRVEYCMzLyqlX7ouw8Z6APD', true),
  ('4b326338-d0db-4f54-bf0d-b85bc22a5a17', '2025-08-04 10:45:12.316657+00', 'Fetch data in next js', 'coding', 'how to fetch data in next js', 'casual', 'female', 8, 'user_30Y5SRVEYCMzLyqlX7ouw8Z6APD', true),
  ('323c35b0-a326-406b-b34f-b11148ef54ea', '2025-08-04 11:39:34.386434+00', 'Next JS companion', 'coding', 'how to fetch data in next js', 'casual', 'male', 8, 'user_30Y5SRVEYCMzLyqlX7ouw8Z6APD', true),
  ('5c0e4165-50f7-4231-8caf-ad9752b429a2', '2025-08-04 13:26:14.390213+00', 'English Learning Course', 'language', 'Subject, Verb, Object', 'formal', 'female', 20, 'user_30Y5SRVEYCMzLyqlX7ouw8Z6APD', true)
on conflict (id) do nothing;

insert into public.session_history (id, created_at, user_id, companion_id) values
  ('f88cf576-a09a-41b7-8111-c56b06b9504d', '2025-08-04 11:39:55.364216+00', 'user_30Y5SRVEYCMzLyqlX7ouw8Z6APD', '323c35b0-a326-406b-b34f-b11148ef54ea'),
  ('a246ed1d-bf67-4b4b-bba4-abc0197a1db5', '2025-08-04 13:26:49.208331+00', 'user_30Y5SRVEYCMzLyqlX7ouw8Z6APD', '5c0e4165-50f7-4231-8caf-ad9752b429a2'),
  ('b98c1c8e-70e9-48a2-ba21-600f955ac349', '2025-08-04 13:28:16.469474+00', 'user_30Y5SRVEYCMzLyqlX7ouw8Z6APD', '323c35b0-a326-406b-b34f-b11148ef54ea')
on conflict (id) do nothing;
