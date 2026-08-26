-- ============================================================
-- Médecin GI — Centre d'annonces
-- À exécuter dans Supabase > SQL Editor (après schema.sql)
-- ============================================================

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  pinned boolean not null default false,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

create policy "announcements_select_authenticated"
  on public.announcements for select
  to authenticated
  using (true);

create policy "announcements_write_admins"
  on public.announcements for all
  to authenticated
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('gerant', 'co_gerant')
  ))
  with check (exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('gerant', 'co_gerant')
  ));

-- Suivi individuel de lecture (1 ligne = 1 annonce lue par 1 utilisateur)
create table public.announcement_reads (
  announcement_id uuid references public.announcements(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

alter table public.announcement_reads enable row level security;

create policy "announcement_reads_select_own"
  on public.announcement_reads for select
  to authenticated
  using (user_id = auth.uid());

create policy "announcement_reads_insert_own"
  on public.announcement_reads for insert
  to authenticated
  with check (user_id = auth.uid());
